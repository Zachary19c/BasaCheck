import { describe, expect, it } from "vitest";
import { normalize } from "./normalize";
import { transcriptFromTaps } from "./taps";

const PASSAGE =
  "Maagang gumising si Ana upang tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.";

describe("transcriptFromTaps", () => {
  it("keeps every word when the teacher marks nothing", () => {
    expect(transcriptFromTaps(PASSAGE, [])).toBe(normalize(PASSAGE).join(" "));
  });

  it("replaces one marked word and leaves the rest", () => {
    const upang = normalize(PASSAGE).indexOf("upang");
    expect(
      transcriptFromTaps(PASSAGE, [{ index: upang, spoken: "para" }]),
    ).toBe(normalize(PASSAGE).join(" ").replace("upang", "para"));
  });

  it("drops a word the learner skipped", () => {
    const upang = normalize(PASSAGE).indexOf("upang");
    const spoken = transcriptFromTaps(PASSAGE, [{ index: upang, spoken: null }]);
    expect(spoken.split(" ")).not.toContain("upang");
    expect(spoken.split(" ")).toHaveLength(normalize(PASSAGE).length - 1);
  });

  it("ignores a mark that is not a passage word", () => {
    expect(transcriptFromTaps(PASSAGE, [{ index: 99, spoken: "iba" }])).toBe(
      normalize(PASSAGE).join(" "),
    );
  });
});
