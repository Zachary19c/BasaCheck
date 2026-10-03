import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AssessmentRow } from "@/lib/types";
import { ProgressView } from "./ProgressView";

const check: AssessmentRow = {
  id: "real-check",
  learnerId: "learner",
  passageId: "passage",
  language: "fil",
  status: "complete",
  transcript: "Sample reading",
  verifiedTranscript: "Sample reading",
  transcriptVerifiedAt: "2026-10-04T08:00:00.000Z",
  demoTranscript: false,
  seededDemo: false,
  inputMode: "speech",
  durationSeconds: 30,
  accuracyPercent: 90,
  wpm: 60,
  comprehensionPercent: 66.7,
  answerIndexes: [0, 1, 2],
  wordEvents: [],
  supportArea: null,
  interventionId: null,
  baselineAssessmentId: null,
  errorCode: null,
  createdAt: "2026-10-04T08:00:00.000Z",
};

function render(assessments: AssessmentRow[]) {
  return renderToStaticMarkup(
    createElement(ProgressView, {
      assessments,
      passageTitles: { passage: "Si Ana at ang Ina" },
    }),
  );
}

describe("progress screen", () => {
  it("keeps preloaded scores behind a closed demo section when no real checks exist", () => {
    const baseline = { ...check, id: "demo-before", seededDemo: true, demoTranscript: true };
    const followUp = {
      ...baseline,
      id: "demo-after",
      baselineAssessmentId: baseline.id,
    };
    const html = render([baseline, followUp]);

    expect(html).toContain("No real reading checks yet");
    expect(html).toContain("Demo and sample checks (1)");
    expect(html).toContain("Demo score example");
    expect(html).toMatch(/<details[^>]*>/);
    expect(html).not.toMatch(/<details[^>]*\sopen(?:\s|>)/);
    expect(html.indexOf("No real reading checks yet")).toBeLessThan(
      html.indexOf("Demo and sample checks"),
    );
  });

  it("shows real checks first and puts Demo Mode checks in the sample section", () => {
    const sample = { ...check, id: "sample-check", demoTranscript: true };
    const html = render([check, sample]);

    expect(html).not.toContain("No real reading checks yet");
    expect(html).toContain("Demo and sample checks (1)");
    expect(html.indexOf("/results/real-check")).toBeLessThan(
      html.indexOf("Demo and sample checks"),
    );
    expect(html.indexOf("/results/sample-check")).toBeGreaterThan(
      html.indexOf("Demo and sample checks"),
    );
  });

  it("still shows a real check when its linked follow-up used Demo Mode", () => {
    const sampleFollowUp = {
      ...check,
      id: "sample-followup",
      baselineAssessmentId: check.id,
      demoTranscript: true,
    };
    const html = render([check, sampleFollowUp]);

    expect(html.indexOf("/results/real-check")).toBeLessThan(
      html.indexOf("Demo and sample checks"),
    );
    expect(html).toContain("No comparable follow-up is shown for this check yet.");
  });
});
