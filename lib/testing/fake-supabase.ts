// In-memory stand-in for the server Supabase client, used by Member 4 route
// tests. Enforces the assessment checks from the initial migration that the
// answers and intervention routes can touch, and logs every write.

export type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null };

export type FakeDb = {
  tables: Record<string, Row[]>;
  writes: { table: string; operation: "insert" | "update"; payload: Row }[];
};

export const db: FakeDb = { tables: {}, writes: [] };

export function resetDb(tables: Record<string, Row[]>) {
  db.tables = tables;
  db.writes = [];
}

function violation(row: Row): string | null {
  const complete = row.status === "complete";
  if (!complete && row.answer_indexes !== null) return "assessments_answers_only_when_complete";
  if (!complete && row.comprehension_percent !== null) return "assessments_comprehension_only_when_complete";
  if (!complete && row.support_area !== null) return "assessments_support_only_when_complete";
  if (!complete && row.intervention_id !== null) return "assessments_intervention_only_when_complete";
  if (
    complete &&
    (row.verified_transcript === null ||
      row.accuracy_percent === null ||
      row.wpm === null ||
      row.comprehension_percent === null ||
      row.answer_indexes === null)
  ) {
    return "assessments_complete_has_scores";
  }
  return null;
}

class Query implements PromiseLike<Result> {
  private filters: [string, unknown][] = [];
  private operation: "select" | "insert" | "update" = "select";
  private payload: Row = {};

  constructor(private table: string) {}

  select() {
    return this;
  }
  insert(row: Row) {
    this.operation = "insert";
    this.payload = row;
    return this;
  }
  update(patch: Row) {
    this.operation = "update";
    this.payload = patch;
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }
  order() {
    return this;
  }
  maybeSingle() {
    return Promise.resolve(this.run(true));
  }
  single() {
    return Promise.resolve(this.run(true));
  }
  then<A = Result, B = never>(
    onFulfilled?: ((value: Result) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve(this.run(false)).then(onFulfilled, onRejected);
  }

  private run(single: boolean): Result {
    const rows = db.tables[this.table] ?? [];
    const matches = (row: Row) => this.filters.every(([column, value]) => row[column] === value);

    if (this.operation === "insert") {
      db.writes.push({ table: this.table, operation: "insert", payload: this.payload });
      rows.push({ ...this.payload });
      return { data: { ...this.payload }, error: null };
    }

    if (this.operation === "update") {
      db.writes.push({ table: this.table, operation: "update", payload: this.payload });
      const targets = rows.filter(matches);
      const updated = targets.map((row) => ({ ...row, ...this.payload }));
      for (const row of updated) {
        const problem = this.table === "assessments" ? violation(row) : null;
        if (problem) return { data: null, error: { message: problem } };
      }
      targets.forEach((row, index) => Object.assign(row, updated[index]));
      return { data: single ? (updated[0] ?? null) : updated, error: null };
    }

    const found = rows.filter(matches).map((row) => ({ ...row }));
    return { data: single ? (found[0] ?? null) : found, error: null };
  }
}

export const fakeServerModule = {
  createClient: () => ({ from: (table: string) => new Query(table) }),
};
