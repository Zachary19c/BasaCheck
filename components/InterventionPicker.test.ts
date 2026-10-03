import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InterventionPicker } from "./InterventionPicker";
import type { InterventionId } from "@/lib/types";

const shared = {
  assessmentId: "30000000-0000-4000-8000-000000000001",
  learnerId: "22222222-2222-4222-8222-222222222222",
  language: "fil" as const,
  suggested: "main-idea" as InterventionId,
};

describe("saved teacher activity", () => {
  it.each([
    ["main-idea", "Understanding the main idea", "what the paragraph is mostly about"],
    ["word-practice", "Reading words accurately", "practiced words in a phrase"],
    ["repeated-reading", "Reading more smoothly", "reread with fewer pauses"],
  ] as const)("shows a distinct plan for %s", (chosen, focus, observation) => {
    const html = renderToStaticMarkup(
      createElement(InterventionPicker, { ...shared, chosen }),
    );

    expect(html).toContain("Activity saved");
    expect(html).toContain(focus);
    expect(html).toContain(observation);
    expect(html).toContain("Start another reading check");
    expect(html).not.toContain("Save chosen activity");
  });

  it("offers the cards before any activity has been saved", () => {
    const html = renderToStaticMarkup(
      createElement(InterventionPicker, { ...shared, chosen: null }),
    );

    expect(html).toContain("Save chosen activity");
    expect(html).toContain("Finding the Main Idea");
    expect(html).toContain("Word Practice");
    expect(html).toContain("Repeated Reading");
    expect(html).not.toContain("Activity saved");
  });
});
