import { beforeEach, describe, expect, it, vi } from "vitest";
import { db, resetDb, type Row } from "@/lib/testing/fake-supabase";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", async () => (await import("@/lib/testing/fake-supabase")).fakeServerModule);

const { POST: submitAnswers } = await import("@/app/api/assessments/[id]/answers/route");

const ANA = "22222222-2222-4222-8222-222222222222";
const PRIMARY = "10000000-0000-4000-8000-000000000001";
// Seeded key for the primary passage: [1, 2, 0].
const QUESTIONS: Row[] = [
  { id: "q1", passage_id: PRIMARY, position: 1, prompt: "Sino?", choices: ["a", "b", "c"], correct_index: 1 },
  { id: "q2", passage_id: PRIMARY, position: 2, prompt: "Saan?", choices: ["a", "b", "c"], correct_index: 2 },
  { id: "q3", passage_id: PRIMARY, position: 3, prompt: "Sino?", choices: ["a", "b", "c"], correct_index: 0 },
];

const REVIEWED: Row = {
  learner_id: ANA,
  passage_id: PRIMARY,
  language: "fil",
  status: "review",
  duration_seconds: 20,
  transcript: "x",
  verified_transcript: "x",
  transcript_verified_at: "2026-10-03T08:00:00.000Z",
  demo_transcript: true,
  seeded_demo: false,
  answer_indexes: null,
  accuracy_percent: (18 / 19) * 100,
  wpm: 57,
  comprehension_percent: null,
  word_events: [{ type: "substitution", expected: "upang", spoken: "para" }],
  support_area: null,
  intervention_id: null,
  baseline_assessment_id: null,
  error_code: null,
  created_at: "2026-10-03T08:00:00.000Z",
};

function insert(values: Row = {}) {
  const id = crypto.randomUUID();
  db.tables.assessments.push({ id, ...REVIEWED, ...values });
  return id;
}

function row(id: string) {
  return db.tables.assessments.find((assessment) => assessment.id === id)!;
}

function post(id: string, body: unknown) {
  return submitAnswers(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

const KEY_FIELDS = /correct|correctIndex|correct_index|answer_key|answerKey/;

beforeEach(() => {
  resetDb({ assessments: [], questions: QUESTIONS.map((q) => ({ ...q })) });
});

describe("POST /api/assessments/[id]/answers", () => {
  it("scores 1/3, suggests comprehension support and completes the row", async () => {
    const id = insert();
    const response = await post(id, { answerIndexes: [1, 0, 1] });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toMatch(KEY_FIELDS);
    const body = JSON.parse(text);
    expect(body).toMatchObject({
      id,
      status: "complete",
      answerIndexes: [1, 0, 1],
      comprehensionPercent: 33.3,
      supportArea: "comprehension",
      wpm: 57,
    });
    expect(row(id)).toMatchObject({ status: "complete", comprehension_percent: 33.3, support_area: "comprehension" });
  });

  it("only produces 0, 33.3, 66.7 or 100 and never uses WPM for support", async () => {
    const cases: [number[], number, string | null][] = [
      [[0, 0, 1], 0, "comprehension"],
      [[1, 0, 1], 33.3, "comprehension"],
      [[1, 2, 1], 66.7, null],
      [[1, 2, 0], 100, null],
    ];
    for (const [answers, percent, support] of cases) {
      const id = insert({ wpm: 5 });
      const body = await (await post(id, { answerIndexes: answers })).json();
      expect(body.comprehensionPercent).toBe(percent);
      expect(body.supportArea).toBe(support);
    }
    const lowAccuracy = insert({ accuracy_percent: 80, wpm: 500 });
    expect((await (await post(lowAccuracy, { answerIndexes: [1, 2, 0] })).json()).supportArea).toBe("accuracy");
  });

  it("rejects a second submit with 409 and leaves the scores unchanged", async () => {
    const id = insert();
    await post(id, { answerIndexes: [1, 2, 0] });
    const before = { ...row(id) };
    const response = await post(id, { answerIndexes: [0, 0, 0] });
    expect(response.status).toBe(409);
    expect(row(id)).toEqual(before);
  });

  it("checks in order: 404, status 409, confirmation 409, body 400, accuracy 409", async () => {
    const bad = { answerIndexes: [9] };

    let response = await post(crypto.randomUUID(), bad);
    expect(response.status).toBe(404);
    expect((await post("not-a-uuid", bad)).status).toBe(404);

    const recording = insert({
      status: "recording",
      verified_transcript: null,
      transcript_verified_at: null,
      accuracy_percent: null,
    });
    response = await post(recording, bad);
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("invalid_status");

    const unconfirmed = insert({ transcript_verified_at: null, accuracy_percent: null });
    response = await post(unconfirmed, bad);
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("transcript_not_confirmed");

    const unscored = insert({ accuracy_percent: null });
    for (const body of [
      bad,
      {},
      { answerIndexes: [1, 2] },
      { answerIndexes: [1, 2, 0, 1] },
      { answerIndexes: [1, 2, 3] },
      { answerIndexes: [1, -1, 0] },
      { answerIndexes: [1, 1.5, 0] },
      { answerIndexes: ["1", 2, 0] },
    ]) {
      response = await post(unscored, body);
      expect(response.status).toBe(400);
    }

    response = await post(unscored, { answerIndexes: [1, 2, 0] });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("reading_not_scored");
    expect(row(unscored)).toMatchObject({ status: "review", answer_indexes: null, comprehension_percent: null });
  });

  it("never includes the answer key in error bodies", async () => {
    const id = insert();
    const response = await post(id, { answerIndexes: [7, 7, 7] });
    expect(await response.text()).not.toMatch(KEY_FIELDS);
  });
});
