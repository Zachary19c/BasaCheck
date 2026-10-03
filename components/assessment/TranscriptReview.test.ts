import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TranscriptReview } from "./TranscriptReview";

const shared = {
  expectedText: "The learner reads this passage.",
  originalTranscript: "The learner reads this passage.",
  initialDraft: "The learner reads this passage.",
  onConfirm: async () => null,
  onRecordAgain: () => {},
};

describe("transcript review modes", () => {
  it("offers recording replay only for a live recording", () => {
    const html = renderToStaticMarkup(
      createElement(TranscriptReview, {
        ...shared,
        demoTranscript: false,
        recordedAudio: new Blob(["audio"], { type: "audio/webm" }),
      }),
    );

    expect(html).toContain("Review recording transcript");
    expect(html).toContain("Learner recording");
    expect(html).toContain("<audio");
    expect(html).toContain("Recognized transcript");
    expect(html).toContain("Replay the recording");
    expect(html).not.toContain("Sample transcript");
  });

  it("labels a fixture as a sample without learner audio", () => {
    const html = renderToStaticMarkup(
      createElement(TranscriptReview, { ...shared, demoTranscript: true, recordedAudio: null }),
    );

    expect(html).toContain("Review sample transcript");
    expect(html).toContain("not the learner’s recording");
    expect(html).toContain("Start a live recording");
    expect(html).not.toContain("<audio");
  });

  it("keeps offline tap separate from recording review", () => {
    const html = renderToStaticMarkup(
      createElement(TranscriptReview, { ...shared, demoTranscript: false, offlineTap: true }),
    );

    expect(html).toContain("Review marked words");
    expect(html).toContain("Marked transcript");
    expect(html).not.toContain("<audio");
  });
});
