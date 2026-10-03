import { describe, expect, it } from "vitest";
import { comprehension, scoreReading } from "./metrics";
import { supportArea } from "./support";

const PRIMARY_PASSAGE =
  "Maagang gumising si Ana upang tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.";

describe("supportArea (demo rules)", () => {
  it("prioritizes comprehension at 1/3, even with high accuracy", () => {
    expect(supportArea((18 * 100) / 19, comprehension(1, 3))).toBe("comprehension");
    expect(supportArea(100, comprehension(1, 3))).toBe("comprehension");
  });

  it("prioritizes comprehension over low accuracy", () => {
    expect(supportArea(40, comprehension(1, 3))).toBe("comprehension");
  });

  it("suggests accuracy when comprehension is at least 60 and accuracy is below 90", () => {
    expect(supportArea(89.99, 60)).toBe("accuracy");
    expect(supportArea(50, comprehension(2, 3))).toBe("accuracy");
  });

  it("returns null otherwise", () => {
    expect(supportArea(90, 60)).toBeNull();
    expect(supportArea((18 * 100) / 19, comprehension(3, 3))).toBeNull();
    expect(supportArea(100, 100)).toBeNull();
  });

  it("uses strict thresholds on unrounded values", () => {
    expect(supportArea(100, 59.999)).toBe("comprehension");
    expect(supportArea(89.999, 100)).toBe("accuracy");
  });

  it("takes no WPM input, so the same reading gets the same suggestion at any rate", () => {
    expect(supportArea.length).toBe(2);

    const para = PRIMARY_PASSAGE.replace("upang", "para");
    for (const comprehensionPercent of [comprehension(1, 3), comprehension(3, 3)]) {
      const results = [1, 20, 600].map((durationSeconds) =>
        scoreReading({ expectedText: PRIMARY_PASSAGE, transcript: para, durationSeconds }),
      );
      expect(new Set(results.map((r) => r.wpm)).size).toBe(3);
      const suggestions = results.map((r) => supportArea(r.accuracyPercent, comprehensionPercent));
      expect(new Set(suggestions).size).toBe(1);
    }
  });

  it("rejects values that are not percentages", () => {
    for (const bad of [Number.NaN, -1, 101, Number.POSITIVE_INFINITY]) {
      expect(() => supportArea(bad, 100)).toThrow(RangeError);
      expect(() => supportArea(100, bad)).toThrow(RangeError);
    }
  });
});
