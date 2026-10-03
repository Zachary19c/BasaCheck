import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Route tests against an in-memory stand-in for the Supabase client. The fake
// enforces the assessment constraints and trigger from the initial migration,
// so a write the real database would reject fails here too.

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null };

const ANA = "22222222-2222-4222-8222-222222222222";
const PRIMARY = "10000000-0000-4000-8000-000000000001";
const BEN = "10000000-0000-4000-8000-000000000002";
const MAYA = "10000000-0000-4000-8000-000000000003";
// Active, but Member 3 has no fixture for it, so Demo Mode is unavailable.
const NO_FIXTURE = "10000000-0000-4000-8000-000000000008";
const INACTIVE = "10000000-0000-4000-8000-000000000009";
const PRIMARY_TEXT =
  "Maagang gumising si Ana upang tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.";
const MAYA_TEXT =
  "Maya planted a seed in a small pot. She gave it water every morning. Soon a green leaf appeared.";

const ASSESSMENT_DEFAULTS: Row = {
  status: "recording",
  duration_seconds: null,
  transcript: null,
  verified_transcript: null,
  transcript_verified_at: null,
  demo_transcript: false,
  seeded_demo: false,
  input_mode: "speech",
  answer_indexes: null,
  accuracy_percent: null,
  wpm: null,
  comprehension_percent: null,
  word_events: [],
  support_area: null,
  intervention_id: null,
  baseline_assessment_id: null,
  error_code: null,
};

let tables: Record<string, Row[]>;

function seed() {
  tables = {
    learners: [{ id: ANA, display_name: "Ana", grade_level: 2 }],
    passages: [
      { id: PRIMARY, content: PRIMARY_TEXT, language: "fil", is_active: true },
      { id: BEN, content: "Si Ben ay may maliit na aso.", language: "fil", is_active: true },
      { id: MAYA, content: MAYA_TEXT, language: "en", is_active: true },
      { id: NO_FIXTURE, content: "Si Lito ay may bola.", language: "fil", is_active: true },
      { id: INACTIVE, content: "Old passage.", language: "en", is_active: false },
    ],
    assessments: [],
  };
}

// Mirrors the assessments checks and private.enforce_assessment_consistency().
function violation(row: Row): string | null {
  const passage = tables.passages.find((p) => p.id === row.passage_id);
  if (!passage) return "passage not found";
  if (!passage.is_active) return "passage is not active";
  if (row.language !== passage.language) return "assessment language must match the passage language";
  if (!["recording", "processing", "review", "complete", "error"].includes(row.status as string)) {
    return "assessments_status_check";
  }
  if (!["speech", "tap"].includes(row.input_mode as string)) return "assessments_input_mode_check";
  if (row.duration_seconds !== null && !((row.duration_seconds as number) > 0)) {
    return "assessments_duration_positive";
  }
  const readingEmpty =
    row.verified_transcript === null &&
    row.transcript_verified_at === null &&
    row.accuracy_percent === null &&
    row.wpm === null &&
    Array.isArray(row.word_events) &&
    row.word_events.length === 0;
  const readingFull =
    row.verified_transcript !== null &&
    row.transcript_verified_at !== null &&
    row.accuracy_percent !== null &&
    row.wpm !== null;
  if (!readingEmpty && !readingFull) return "assessments_reading_fields_together";
  if (
    row.status === "error" &&
    (row.accuracy_percent !== null || row.wpm !== null || row.comprehension_percent !== null)
  ) {
    return "assessments_error_has_no_scores";
  }
  if (row.status !== "complete" && (row.answer_indexes !== null || row.comprehension_percent !== null)) {
    return "assessments_answers_only_when_complete";
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
    const rows = tables[this.table];
    const matches = (row: Row) => this.filters.every(([column, value]) => row[column] === value);

    if (this.operation === "insert") {
      const row: Row = { id: crypto.randomUUID(), ...ASSESSMENT_DEFAULTS, ...this.payload };
      const problem = violation(row);
      if (problem) return { data: null, error: { message: problem } };
      rows.push(row);
      return { data: { ...row }, error: null };
    }

    if (this.operation === "update") {
      const targets = rows.filter(matches);
      const updated = targets.map((row) => ({ ...row, ...this.payload }));
      for (const row of updated) {
        const problem = violation(row);
        if (problem) return { data: null, error: { message: problem } };
      }
      targets.forEach((row, index) => Object.assign(row, updated[index]));
      return { data: single ? (updated[0] ?? null) : updated, error: null };
    }

    const found = rows.filter(matches).map((row) => ({ ...row }));
    return { data: single ? (found[0] ?? null) : found, error: null };
  }
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ from: (table: string) => new Query(table) }),
}));

const { POST: createAssessment } = await import("@/app/api/assessments/route");
const { POST: uploadAudio } = await import("@/app/api/assessments/[id]/audio/route");
const { POST: confirmTranscript } = await import("@/app/api/assessments/[id]/confirm/route");
const { POST: saveTap } = await import("@/app/api/assessments/[id]/tap/route");

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function audioRequest(fields: Record<string, string | Blob>) {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.append(name, value);
  return new Request("http://localhost/api", { method: "POST", body: form });
}

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

function row(id: string) {
  return tables.assessments.find((assessment) => assessment.id === id)!;
}

function insertAssessment(values: Row) {
  const assessment: Row = {
    id: crypto.randomUUID(),
    learner_id: ANA,
    ...ASSESSMENT_DEFAULTS,
    ...values,
  };
  tables.assessments.push(assessment);
  return assessment.id as string;
}

const recording = () => new Blob([new Uint8Array(2048)], { type: "audio/webm" });

beforeEach(() => {
  seed();
  vi.stubEnv("DEMO_MODE", "false");
  vi.stubEnv("SPEECH_SERVICE_URL", "http://127.0.0.1:8000");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/assessments", () => {
  it("creates a recording-status assessment with the passage's language", async () => {
    const response = await createAssessment(
      jsonRequest({ learnerId: ANA, passageId: MAYA, language: "en" }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ status: "recording", language: "en", demoTranscript: false });
    expect(row(body.id)).toMatchObject({
      learner_id: ANA,
      passage_id: MAYA,
      language: "en",
      status: "recording",
      demo_transcript: false,
    });
  });

  it("rejects bad input without creating a row", async () => {
    const cases: [unknown, number, string][] = [
      [{ learnerId: "ana", passageId: PRIMARY, language: "fil" }, 400, "invalid_request"],
      [{ learnerId: ANA, passageId: PRIMARY, language: "tl" }, 400, "invalid_request"],
      [{ learnerId: ANA, passageId: PRIMARY }, 400, "invalid_request"],
      [{ learnerId: ANA, passageId: PRIMARY, language: "en" }, 400, "language_mismatch"],
      [{ learnerId: ANA, passageId: PRIMARY, language: "fil", useFixture: "yes" }, 400, "invalid_request"],
      [{ learnerId: crypto.randomUUID(), passageId: PRIMARY, language: "fil" }, 404, "learner_not_found"],
      [{ learnerId: ANA, passageId: INACTIVE, language: "en" }, 404, "passage_not_found"],
    ];
    for (const [payload, status, code] of cases) {
      const response = await createAssessment(jsonRequest(payload));
      expect(response.status).toBe(status);
      expect((await response.json()).error.code).toBe(code);
    }
    expect(tables.assessments).toHaveLength(0);
  });

  it("labels every new assessment as demo when DEMO_MODE=true", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    const response = await createAssessment(
      jsonRequest({ learnerId: ANA, passageId: PRIMARY, language: "fil" }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.demoTranscript).toBe(true);
    expect(row(body.id).demo_transcript).toBe(true);
  });

  it("offers Demo Mode for passages that have a Member 3 fixture", async () => {
    for (const [passageId, language] of [
      [PRIMARY, "fil"],
      [BEN, "fil"],
      [MAYA, "en"],
    ]) {
      const response = await createAssessment(
        jsonRequest({ learnerId: ANA, passageId, language, useFixture: true }),
      );
      expect(response.status).toBe(201);
      expect((await response.json()).demoTranscript).toBe(true);
    }
  });

  it("keeps an offline tap unlabeled as Demo Mode even when DEMO_MODE=true", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    const response = await createAssessment(
      jsonRequest({ learnerId: ANA, passageId: PRIMARY, language: "fil", inputMode: "tap" }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.demoTranscript).toBe(false);
    expect(row(body.id)).toMatchObject({ input_mode: "tap", demo_transcript: false, status: "recording" });
  });

  it("refuses to mix an offline tap with a prepared transcript", async () => {
    const response = await createAssessment(
      jsonRequest({ learnerId: ANA, passageId: PRIMARY, language: "fil", inputMode: "tap", useFixture: true }),
    );
    expect(response.status).toBe(400);
    expect(tables.assessments).toHaveLength(0);
  });

  it("refuses Demo Mode for a passage with no fixture", async () => {
    const response = await createAssessment(
      jsonRequest({ learnerId: ANA, passageId: NO_FIXTURE, language: "fil", useFixture: true }),
    );
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("fixture_unavailable");
    expect(tables.assessments).toHaveLength(0);
  });
});

describe("POST /api/assessments/[id]/audio", () => {
  it("loads the passage fixture for a demo assessment without calling the speech service", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const id = insertAssessment({ passage_id: PRIMARY, language: "fil", demo_transcript: true });

    const response = await uploadAudio(new Request("http://localhost/api", { method: "POST" }), context(id));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "review",
      durationSeconds: 20,
      demoTranscript: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(row(id)).toMatchObject({ status: "review", duration_seconds: 20, accuracy_percent: null });
    expect(row(id).transcript).toContain("para tulungan");
  });

  it("transcribes a live recording with the stored language and does not score it", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ transcript: "Maagang gumising si Ana", durationSeconds: 6.25 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const id = insertAssessment({ passage_id: PRIMARY, language: "fil" });

    const response = await uploadAudio(audioRequest({ audio: recording(), language: "fil" }), context(id));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "review",
      transcript: "Maagang gumising si Ana",
      durationSeconds: 6.25,
      demoTranscript: false,
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe("http://127.0.0.1:8000/transcribe");
    expect((init.body as FormData).get("language")).toBe("tl");
    expect(row(id)).toMatchObject({
      status: "review",
      transcript: "Maagang gumising si Ana",
      duration_seconds: 6.25,
      verified_transcript: null,
      accuracy_percent: null,
      wpm: null,
      error_code: null,
    });
  });

  it("records an error with no transcript or scores when the speech service is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    const id = insertAssessment({ passage_id: MAYA, language: "en" });

    const response = await uploadAudio(audioRequest({ audio: recording() }), context(id));
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("speech_unavailable");
    expect(row(id)).toMatchObject({
      status: "error",
      error_code: "speech_unavailable",
      transcript: null,
      accuracy_percent: null,
    });
  });

  it("stores the speech service's own error code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ detail: { code: "empty_transcript", message: "x" } }, { status: 422 }),
      ),
    );
    const id = insertAssessment({ passage_id: MAYA, language: "en" });

    const response = await uploadAudio(audioRequest({ audio: recording() }), context(id));
    expect(response.status).toBe(422);
    expect(row(id)).toMatchObject({ status: "error", error_code: "empty_transcript" });
  });

  it("rejects a mismatched language, an empty file and a second upload", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const id = insertAssessment({ passage_id: PRIMARY, language: "fil" });

    let response = await uploadAudio(audioRequest({ audio: recording(), language: "en" }), context(id));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("language_mismatch");

    response = await uploadAudio(audioRequest({ audio: new Blob([]) }), context(id));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("invalid_audio");
    expect(row(id).status).toBe("recording");

    const reviewed = insertAssessment({
      passage_id: PRIMARY,
      language: "fil",
      status: "review",
      transcript: "x",
      duration_seconds: 5,
    });
    response = await uploadAudio(audioRequest({ audio: recording() }), context(reviewed));
    expect(response.status).toBe(409);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown or malformed assessment ID", async () => {
    expect((await uploadAudio(audioRequest({}), context("nope"))).status).toBe(404);
    expect((await uploadAudio(audioRequest({}), context(crypto.randomUUID()))).status).toBe(404);
  });
});

describe("POST /api/assessments/[id]/confirm", () => {
  function demoReview() {
    return insertAssessment({
      passage_id: PRIMARY,
      language: "fil",
      status: "review",
      demo_transcript: true,
      duration_seconds: 20,
      transcript: PRIMARY_TEXT.replace("upang", "para"),
    });
  }

  it("scores the confirmed primary fixture as 18/19 and 57 WPM", async () => {
    const id = demoReview();
    const verified = PRIMARY_TEXT.replace("upang", "para");

    const response = await confirmTranscript(jsonRequest({ verifiedTranscript: ` ${verified} ` }), context(id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.accuracyPercent).toBeCloseTo((18 / 19) * 100, 10);
    expect(body.wpm).toBe(57);
    expect(body.wordEvents.filter((event: { type: string }) => event.type !== "match")).toEqual([
      { type: "substitution", expected: "upang", spoken: "para" },
    ]);
    expect(row(id)).toMatchObject({
      status: "review",
      verified_transcript: verified,
      wpm: 57,
      comprehension_percent: null,
      support_area: null,
    });
    expect(row(id).transcript_verified_at).toEqual(expect.any(String));
  });

  it("recomputes the measurements when a corrected transcript is confirmed again", async () => {
    const id = demoReview();
    await confirmTranscript(jsonRequest({ verifiedTranscript: PRIMARY_TEXT.replace("upang", "para") }), context(id));

    const response = await confirmTranscript(jsonRequest({ verifiedTranscript: PRIMARY_TEXT }), context(id));
    expect(response.status).toBe(200);
    expect((await response.json()).accuracyPercent).toBe(100);
    expect(row(id)).toMatchObject({ accuracy_percent: 100, verified_transcript: PRIMARY_TEXT });
  });

  it("runs the English demo fixture end to end: audio, then confirm", async () => {
    const id = insertAssessment({ passage_id: MAYA, language: "en", demo_transcript: true });
    const audio = await uploadAudio(new Request("http://localhost/api", { method: "POST" }), context(id));
    expect(audio.status).toBe(200);
    const { transcript, durationSeconds } = await audio.json();
    expect(durationSeconds).toBe(20);

    const response = await confirmTranscript(jsonRequest({ verifiedTranscript: transcript }), context(id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.accuracyPercent).toBe(100);
    expect(body.wpm).toBe(57);
  });

  it("scores a live transcript with the recording's own duration", async () => {
    const id = insertAssessment({
      passage_id: MAYA,
      language: "en",
      status: "review",
      transcript: MAYA_TEXT,
      duration_seconds: 9.5,
    });
    const response = await confirmTranscript(jsonRequest({ verifiedTranscript: MAYA_TEXT }), context(id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.accuracyPercent).toBe(100);
    expect(body.wpm).toBeCloseTo((19 * 60) / 9.5, 10);
  });

  it("never scores before a transcript exists", async () => {
    const id = insertAssessment({ passage_id: PRIMARY, language: "fil" });
    const response = await confirmTranscript(jsonRequest({ verifiedTranscript: PRIMARY_TEXT }), context(id));
    expect(response.status).toBe(409);
    expect(row(id).accuracy_percent).toBeNull();
  });

  it("rejects empty or wordless transcripts", async () => {
    const id = demoReview();
    let response = await confirmTranscript(jsonRequest({ verifiedTranscript: "   " }), context(id));
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("empty_transcript");

    response = await confirmTranscript(jsonRequest({ verifiedTranscript: "... !!" }), context(id));
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("empty_transcript");

    response = await confirmTranscript(jsonRequest({}), context(id));
    expect(response.status).toBe(400);
    expect(row(id).accuracy_percent).toBeNull();
  });

  it("refuses to score a demo transcript whose duration is not the fixture's", async () => {
    const id = insertAssessment({
      passage_id: PRIMARY,
      language: "fil",
      status: "review",
      demo_transcript: true,
      duration_seconds: 33,
      transcript: PRIMARY_TEXT,
    });
    const response = await confirmTranscript(jsonRequest({ verifiedTranscript: PRIMARY_TEXT }), context(id));
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("fixture_mismatch");
    expect(row(id).accuracy_percent).toBeNull();
  });

  it("refuses to score a demo transcript for a passage without a fixture", async () => {
    const id = insertAssessment({
      passage_id: NO_FIXTURE,
      language: "fil",
      status: "review",
      demo_transcript: true,
      duration_seconds: 20,
      transcript: "Si Lito ay may bola.",
    });
    const response = await confirmTranscript(
      jsonRequest({ verifiedTranscript: "Si Lito ay may bola." }),
      context(id),
    );
    expect(response.status).toBe(409);
    expect(row(id).accuracy_percent).toBeNull();
  });
});

describe("POST /api/assessments/[id]/tap", () => {
  it("saves the marked transcript without scoring it", async () => {
    const created = await createAssessment(
      jsonRequest({ learnerId: ANA, passageId: PRIMARY, language: "fil", inputMode: "tap" }),
    );
    const id = (await created.json()).id as string;
    const response = await saveTap(
      jsonRequest({
        transcript: "maagang gumising si ana para tulungan ang kanyang ina",
        durationSeconds: 18.5,
      }),
      context(id),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "review", durationSeconds: 18.5 });
    expect(row(id)).toMatchObject({
      status: "review",
      input_mode: "tap",
      demo_transcript: false,
      accuracy_percent: null,
      duration_seconds: 18.5,
    });
  });

  it("rejects a tap upload on a recording assessment", async () => {
    const id = insertAssessment({ passage_id: PRIMARY, language: "fil", input_mode: "speech" });
    const response = await saveTap(
      jsonRequest({ transcript: "maagang gumising", durationSeconds: 10 }),
      context(id),
    );
    expect(response.status).toBe(409);
    expect(row(id).transcript).toBeNull();
  });

  it("rejects a tap that never started the timer", async () => {
    const id = insertAssessment({ passage_id: PRIMARY, language: "fil", input_mode: "tap" });
    const response = await saveTap(
      jsonRequest({ transcript: "maagang gumising", durationSeconds: 0 }),
      context(id),
    );
    expect(response.status).toBe(422);
    expect(row(id).status).toBe("recording");
  });
});
