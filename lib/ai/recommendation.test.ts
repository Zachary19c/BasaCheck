import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AssessmentRow } from "@/lib/types";

vi.mock("server-only", () => ({}));

const { buildRecommendationFacts, parseRecommendation, requestRecommendation } = await import(
  "@/lib/ai/recommendation"
);

const ASSESSMENT: AssessmentRow = {
  id: "30000000-0000-4000-8000-000000000001",
  learnerId: "22222222-2222-4222-8222-222222222222",
  passageId: "10000000-0000-4000-8000-000000000001",
  language: "fil",
  status: "complete",
  transcript: "Maagang gumising si Ana para tulungan ang kanyang ina.",
  verifiedTranscript: "Maagang gumising si Ana para tulungan ang kanyang ina.",
  transcriptVerifiedAt: "2026-10-04T01:00:00.000Z",
  demoTranscript: true,
  seededDemo: false,
  inputMode: "speech",
  durationSeconds: 20,
  accuracyPercent: (18 / 19) * 100,
  wpm: 57,
  comprehensionPercent: 100 / 3,
  answerIndexes: [0, 0, 0],
  wordEvents: [
    { type: "match", expected: "ana", spoken: "ana" },
    { type: "substitution", expected: "upang", spoken: "para" },
  ],
  supportArea: "comprehension",
  interventionId: null,
  baselineAssessmentId: null,
  errorCode: null,
  createdAt: "2026-10-04T01:00:00.000Z",
};

const GOOD_ANSWER = {
  activityId: "main-idea",
  summary: "Most words matched the passage, and one of three comprehension answers was correct.",
  reasons: ["Comprehension was 33.3%, and the demo rule suggests main-idea practice."],
  tips: ["Read a short paragraph together and ask what it is mostly about."],
};

function groqReply(content: string, status = 200) {
  return vi.fn(async () =>
    Response.json({ choices: [{ message: { content } }] }, { status }),
  );
}

beforeEach(() => vi.stubEnv("GROQ_API_KEY", "test-key"));
afterEach(() => vi.unstubAllEnvs());

describe("AI recommendation facts", () => {
  it("sends accuracy, comprehension and differences only: no name, IDs, transcript or rate", () => {
    const facts = buildRecommendationFacts(ASSESSMENT, "Si Ana at ang Ina");
    const text = JSON.stringify(facts);
    expect(facts.measurements).toEqual({
      passageReadingAccuracyPercent: 94.7,
      comprehensionPercent: 33.3,
    });
    expect(text).not.toMatch(/wpm|rate/i);
    expect(facts.wordDifferences).toEqual([{ type: "substitution", expected: "upang", spoken: "para" }]);
    expect(facts.demoRule.suggestedActivityId).toBe("main-idea");
    expect(facts.labels).toEqual(["Demo Mode: this transcript was not produced by a live recording."]);
    expect(facts.activityCards.map((card) => card.title)).toEqual([
      "Finding the Main Idea",
      "Word Practice",
      "Repeated Reading",
    ]);
    expect(text).not.toContain(ASSESSMENT.id);
    expect(text).not.toContain(ASSESSMENT.learnerId);
    expect(text).not.toContain("tulungan ang kanyang ina");
  });
});

describe("parseRecommendation", () => {
  it("accepts a valid answer, including one wrapped in a code fence", () => {
    const fenced = "```json\n" + JSON.stringify(GOOD_ANSWER) + "\n```";
    expect(parseRecommendation(fenced, "model-x")).toMatchObject({
      activityId: "main-idea",
      activityTitle: "Finding the Main Idea",
      model: "model-x",
    });
  });

  it("requires the demo rule's activity when there is one, and marks no-suggestion picks optional", () => {
    expect(parseRecommendation(JSON.stringify(GOOD_ANSWER), "m", "main-idea").optional).toBe(false);
    expect(() =>
      parseRecommendation(JSON.stringify({ ...GOOD_ANSWER, activityId: "repeated-reading" }), "m", "main-idea"),
    ).toThrow(expect.objectContaining({ code: "ai_invalid_response" }));
    const free = parseRecommendation(JSON.stringify({ ...GOOD_ANSWER, activityId: "repeated-reading" }), "m", null);
    expect(free).toMatchObject({ activityId: "repeated-reading", optional: true });
  });

  it("rejects unknown activities, missing fields and diagnosis language", () => {
    const bad = [
      "not json",
      JSON.stringify({ ...GOOD_ANSWER, activityId: "phonics-drill" }),
      JSON.stringify({ ...GOOD_ANSWER, reasons: [] }),
      JSON.stringify({ ...GOOD_ANSWER, summary: "" }),
      JSON.stringify({ ...GOOD_ANSWER, summary: "This may indicate dyslexia." }),
      JSON.stringify({ ...GOOD_ANSWER, tips: ["Screen for a reading disorder."] }),
      JSON.stringify({ ...GOOD_ANSWER, summary: "Their reading rate is moderate, so practice fluency." }),
      JSON.stringify({ ...GOOD_ANSWER, reasons: ["99 wpm suggests room to grow."] }),
    ];
    for (const content of bad) {
      expect(() => parseRecommendation(content, "m")).toThrow(expect.objectContaining({ code: "ai_invalid_response" }));
    }
  });
});

describe("requestRecommendation", () => {
  const facts = buildRecommendationFacts(ASSESSMENT, "Si Ana at ang Ina");

  it("calls Groq with the key, JSON mode and the default model", async () => {
    const fetchMock = groqReply(JSON.stringify(GOOD_ANSWER));
    const result = await requestRecommendation(facts, fetchMock as unknown as typeof fetch);
    expect(result.activityTitle).toBe("Finding the Main Idea");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("openai/gpt-oss-120b");
    expect(body.reasoning_effort).toBe("low");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0].content).toContain("Never diagnose");
  });

  it("retries once when an answer breaks a rule, and gives up after a second miss", async () => {
    const replies = [
      JSON.stringify({ ...GOOD_ANSWER, summary: "Reading fluency could improve." }),
      JSON.stringify(GOOD_ANSWER),
    ];
    const recovering = vi.fn(async () => Response.json({ choices: [{ message: { content: replies.shift() } }] }));
    const result = await requestRecommendation(facts, recovering as unknown as typeof fetch);
    expect(result.activityId).toBe("main-idea");
    expect(recovering).toHaveBeenCalledTimes(2);

    const alwaysBad = groqReply(JSON.stringify({ ...GOOD_ANSWER, summary: "Practice fluency." }));
    await expect(requestRecommendation(facts, alwaysBad as unknown as typeof fetch)).rejects.toMatchObject({
      code: "ai_invalid_response",
    });
    expect(alwaysBad).toHaveBeenCalledTimes(2);
  });

  it("uses GROQ_MODEL when set", async () => {
    vi.stubEnv("GROQ_MODEL", "llama-3.3-70b-versatile");
    const fetchMock = groqReply(JSON.stringify(GOOD_ANSWER));
    const result = await requestRecommendation(facts, fetchMock as unknown as typeof fetch);
    expect(result.model).toBe("llama-3.3-70b-versatile");
  });

  it("reports a missing key, a busy service and a timeout", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    await expect(requestRecommendation(facts, groqReply("{}") as unknown as typeof fetch)).rejects.toMatchObject({
      code: "ai_not_configured",
      status: 503,
    });

    vi.stubEnv("GROQ_API_KEY", "test-key");
    const limited = groqReply("{}", 429);
    await expect(requestRecommendation(facts, limited as unknown as typeof fetch)).rejects.toMatchObject({
      code: "ai_rate_limited",
      status: 429,
    });
    expect(limited).toHaveBeenCalledTimes(1);

    const down = groqReply("{}", 500);
    await expect(requestRecommendation(facts, down as unknown as typeof fetch)).rejects.toMatchObject({
      code: "ai_unavailable",
    });

    const slow = vi.fn(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    await expect(requestRecommendation(facts, slow as unknown as typeof fetch)).rejects.toMatchObject({
      code: "ai_timeout",
    });
  });
});
