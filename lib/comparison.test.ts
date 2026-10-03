import { describe, expect, it } from "vitest";
import {
  buildComparisons,
  compareAssessments,
  COMPARISON_NOTE,
  MISMATCH_MESSAGE,
} from "@/lib/comparison";
import type { AssessmentRow } from "@/lib/types";

const mockBaseline: AssessmentRow = {
  id: "baseline-demo",
  learnerId: "ana",
  passageId: "fil-passage-1",
  language: "fil",
  status: "complete",
  transcript: null,
  verifiedTranscript: "verified text comes from the confirm route",
  transcriptVerifiedAt: "2026-10-03T08:00:00.000Z",
  demoTranscript: true,
  seededDemo: true,
  durationSeconds: 20,
  accuracyPercent: 84.2,
  wpm: 57,
  comprehensionPercent: 33.3,
  answerIndexes: [0, 0, 1],
  wordEvents: [
    { type: "match", expected: "upang", spoken: "upang" },
    { type: "substitution", expected: "upang", spoken: "para" },
  ],
  supportArea: "comprehension",
  interventionId: null,
  baselineAssessmentId: null,
  errorCode: null,
  createdAt: "2026-10-03T08:00:00.000Z",
};

const mockFollowUp: AssessmentRow = {
  ...mockBaseline,
  id: "followup-demo",
  baselineAssessmentId: "baseline-demo",
  accuracyPercent: 94.7,
  wpm: 72,
  comprehensionPercent: 66.7,
  answerIndexes: [0, 1, 1],
  supportArea: "accuracy",
  interventionId: "main-idea",
  createdAt: "2026-10-03T09:00:00.000Z",
};

describe("compareAssessments", () => {
  it("describes a valid linked pair as observed change in percentage points and words per minute", () => {
    const result = compareAssessments(mockBaseline, mockFollowUp);
    expect(result.kind).toBe("pair");
    if (result.kind !== "pair") return;
    expect(result.lines).toEqual([
      "Passage Reading Accuracy: 84.2% → 94.7% (+10.5 percentage points)",
      "Comprehension: 33.3% → 66.7% (+33.4 percentage points)",
      "Reading Rate: 57 → 72 words per minute (+15 words per minute)",
    ]);
    expect(COMPARISON_NOTE).toBe(
      "This compares the linked baseline and follow-up. It does not show that the activity caused the change.",
    );
    expect(result.lines.join(" ")).not.toMatch(/percent improvement/i);
  });

  it.each([
    ["learner", { learnerId: "someone-else" }],
    ["language", { language: "en" as const }],
    ["passage", { passageId: "fil-passage-2" }],
    ["baseline link", { baselineAssessmentId: "another-baseline" }],
  ])("reports a %s mismatch with no deltas", (_label, patch) => {
    const result = compareAssessments(mockBaseline, { ...mockFollowUp, ...patch });
    expect(result.kind).toBe("mismatch");
    expect(result).not.toHaveProperty("lines");
    expect(MISMATCH_MESSAGE).toBe(
      "This follow-up is not linked. Learner, language, or passage does not match the baseline.",
    );
  });

  it("returns none when no follow-up is linked", () => {
    expect(compareAssessments(mockBaseline, null)).toEqual({ kind: "none", baseline: mockBaseline });
  });

  it("uses the minus sign for a decrease", () => {
    const result = compareAssessments(mockBaseline, {
      ...mockFollowUp,
      accuracyPercent: 73.7,
      comprehensionPercent: 0,
      wpm: 50,
    });
    if (result.kind !== "pair") throw new Error("expected a pair");
    expect(result.lines).toEqual([
      "Passage Reading Accuracy: 84.2% → 73.7% (\u221210.5 percentage points)",
      "Comprehension: 33.3% → 0% (\u221233.3 percentage points)",
      "Reading Rate: 57 → 50 words per minute (\u22127 words per minute)",
    ]);
  });

  it("reports no change without a sign", () => {
    const result = compareAssessments(mockBaseline, {
      ...mockFollowUp,
      accuracyPercent: 84.2,
      comprehensionPercent: 33.3,
      wpm: 57,
    });
    if (result.kind !== "pair") throw new Error("expected a pair");
    expect(result.lines).toEqual([
      "Passage Reading Accuracy: 84.2% → 84.2% (no change in percentage points)",
      "Comprehension: 33.3% → 33.3% (no change in percentage points)",
      "Reading Rate: 57 → 57 words per minute (no change in words per minute)",
    ]);
  });
});

describe("buildComparisons", () => {
  it("pairs only through baselineAssessmentId, never by newest row", () => {
    const newerUnlinked: AssessmentRow = {
      ...mockBaseline,
      id: "live-run",
      createdAt: "2026-10-03T10:00:00.000Z",
    };
    const results = buildComparisons([newerUnlinked, mockFollowUp, mockBaseline]);
    const pair = results.find((result) => result.kind === "pair");
    expect(pair?.baseline.id).toBe("baseline-demo");
    expect(pair?.kind === "pair" && pair.followUp.id).toBe("followup-demo");
    expect(results.find((result) => result.baseline.id === "live-run")?.kind).toBe("none");
  });
});
