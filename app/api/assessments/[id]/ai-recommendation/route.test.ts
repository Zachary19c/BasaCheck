import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db, fakeServerModule, resetDb } from "@/lib/testing/fake-supabase";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => fakeServerModule);

const { POST } = await import("@/app/api/assessments/[id]/ai-recommendation/route");

const COMPLETE = "30000000-0000-4000-8000-000000000001";
const IN_REVIEW = "30000000-0000-4000-8000-000000000002";
const PRIMARY = "10000000-0000-4000-8000-000000000001";

function row(id: string, status: string) {
  return {
    id,
    learner_id: "22222222-2222-4222-8222-222222222222",
    passage_id: PRIMARY,
    language: "fil",
    status,
    transcript: "x",
    verified_transcript: "x",
    transcript_verified_at: "2026-10-04T01:00:00.000Z",
    demo_transcript: false,
    seeded_demo: false,
    input_mode: "speech",
    duration_seconds: 20,
    accuracy_percent: 100,
    wpm: 57,
    comprehension_percent: status === "complete" ? 100 : null,
    answer_indexes: status === "complete" ? [1, 2, 0] : null,
    word_events: [],
    support_area: null,
    intervention_id: null,
    baseline_assessment_id: null,
    error_code: null,
    created_at: "2026-10-04T01:00:00.000Z",
  };
}

function call(id: string) {
  return POST(new Request(`http://localhost/api/assessments/${id}/ai-recommendation`, { method: "POST" }), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  vi.stubEnv("GROQ_API_KEY", "test-key");
  resetDb({
    passages: [{ id: PRIMARY, title: "Si Ana at ang Ina" }],
    assessments: [row(COMPLETE, "complete"), row(IN_REVIEW, "review")],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/assessments/[id]/ai-recommendation", () => {
  it("returns the AI recommendation for a completed check without saving anything", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  activityId: "repeated-reading",
                  summary: "All words matched and all three answers were correct.",
                  reasons: ["There is no demo-rule suggestion, so this activity is optional."],
                  tips: ["Model the passage, then read it together."],
                }),
              },
            },
          ],
        }),
      ),
    );
    const response = await call(COMPLETE);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ activityId: "repeated-reading", activityTitle: "Repeated Reading" });
    expect(db.writes).toEqual([]);
  });

  it("only works after the check is complete", async () => {
    const response = await call(IN_REVIEW);
    expect(response.status).toBe(409);
  });

  it("returns 404 for unknown or malformed IDs", async () => {
    expect((await call("nope")).status).toBe(404);
    expect((await call("99999999-9999-4999-8999-999999999999")).status).toBe(404);
  });

  it("explains a missing key without breaking the page", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const response = await call(COMPLETE);
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("ai_not_configured");
  });
});
