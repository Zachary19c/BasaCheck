import { beforeEach, describe, expect, it, vi } from "vitest";
import { db, resetDb, type Row } from "@/lib/testing/fake-supabase";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", async () => (await import("@/lib/testing/fake-supabase")).fakeServerModule);

const { POST: saveIntervention } = await import("@/app/api/assessments/[id]/intervention/route");

const COMPLETE: Row = {
  learner_id: "22222222-2222-4222-8222-222222222222",
  passage_id: "10000000-0000-4000-8000-000000000001",
  language: "fil",
  status: "complete",
  duration_seconds: 20,
  transcript: "x",
  verified_transcript: "x",
  transcript_verified_at: "2026-10-03T08:00:00.000Z",
  demo_transcript: false,
  seeded_demo: false,
  answer_indexes: [1, 0, 0],
  accuracy_percent: (18 / 19) * 100,
  wpm: 57,
  comprehension_percent: 33.3,
  word_events: [],
  support_area: "comprehension",
  intervention_id: null,
  baseline_assessment_id: null,
  error_code: null,
  created_at: "2026-10-03T08:00:00.000Z",
};

function insert(values: Row = {}) {
  const id = crypto.randomUUID();
  db.tables.assessments.push({ id, ...COMPLETE, ...values });
  return id;
}

function row(id: string) {
  return db.tables.assessments.find((assessment) => assessment.id === id)!;
}

function post(id: string, body: unknown) {
  return saveIntervention(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

beforeEach(() => {
  resetDb({ assessments: [] });
});

describe("POST /api/assessments/[id]/intervention", () => {
  it("saves any of the three cards, regardless of the suggestion, and writes intervention_id only", async () => {
    const id = insert();
    const before = { ...row(id) };

    for (const interventionId of ["repeated-reading", "word-practice", "main-idea"]) {
      const response = await post(id, { interventionId });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({ id, interventionId, status: "complete", supportArea: "comprehension" });
      expect(row(id)).toEqual({ ...before, intervention_id: interventionId });
    }

    expect(db.writes.every((write) => write.operation === "update")).toBe(true);
    expect(db.writes.map((write) => Object.keys(write.payload))).toEqual([
      ["intervention_id"],
      ["intervention_id"],
      ["intervention_id"],
    ]);
    expect(db.tables.assessments).toHaveLength(1);
  });

  it("rejects an unknown intervention id with 400", async () => {
    const id = insert();
    for (const body of [{ interventionId: "phonics" }, {}, { interventionId: 1 }]) {
      const response = await post(id, body);
      expect(response.status).toBe(400);
    }
    expect(row(id).intervention_id).toBeNull();
    expect(db.writes).toHaveLength(0);
  });

  it("returns 404 for a missing assessment", async () => {
    expect((await post(crypto.randomUUID(), { interventionId: "main-idea" })).status).toBe(404);
    expect((await post("nope", { interventionId: "main-idea" })).status).toBe(404);
  });

  it("returns 409 for an assessment that is not complete", async () => {
    const id = insert({ status: "review", answer_indexes: null, comprehension_percent: null, support_area: null });
    const response = await post(id, { interventionId: "main-idea" });
    expect(response.status).toBe(409);
    expect(row(id).intervention_id).toBeNull();
    expect(db.writes).toHaveLength(0);
  });
});
