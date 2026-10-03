import { describe, expect, it } from "vitest";
import type { WordEvent } from "@/lib/types";
import { align } from "./align";

const words = (text: string) => text.split(" ").filter(Boolean);

// Every expected token appears once (match/substitution/omission) and every
// spoken token appears once (match/substitution/insertion), in order.
function expectCoversBothSides(expected: string[], spoken: string[], events: WordEvent[]) {
  expect(events.filter((e) => e.type !== "insertion").map((e) => e.expected)).toEqual(expected);
  expect(events.filter((e) => e.type !== "omission").map((e) => e.spoken)).toEqual(spoken);
}

describe("align", () => {
  it("matches every token of an identical reading", () => {
    const tokens = words("si ana at ang ina");
    const events = align(tokens, tokens);
    expect(events).toEqual(tokens.map((t) => ({ type: "match", expected: t, spoken: t })));
  });

  it("reports a substitution in place", () => {
    expect(align(words("ana upang tulungan"), words("ana para tulungan"))).toEqual([
      { type: "match", expected: "ana", spoken: "ana" },
      { type: "substitution", expected: "upang", spoken: "para" },
      { type: "match", expected: "tulungan", spoken: "tulungan" },
    ]);
  });

  it("reports an omission for a skipped word", () => {
    expect(align(words("ang kanyang ina"), words("ang ina"))).toEqual([
      { type: "match", expected: "ang", spoken: "ang" },
      { type: "omission", expected: "kanyang" },
      { type: "match", expected: "ina", spoken: "ina" },
    ]);
  });

  it("reports an insertion for an added word", () => {
    expect(align(words("ang ina"), words("ang mabait ina"))).toEqual([
      { type: "match", expected: "ang", spoken: "ang" },
      { type: "insertion", spoken: "mabait" },
      { type: "match", expected: "ina", spoken: "ina" },
    ]);
  });

  it("handles empty sides", () => {
    expect(align([], [])).toEqual([]);
    expect(align(words("a b"), [])).toEqual([
      { type: "omission", expected: "a" },
      { type: "omission", expected: "b" },
    ]);
    expect(align([], words("a b"))).toEqual([
      { type: "insertion", spoken: "a" },
      { type: "insertion", spoken: "b" },
    ]);
  });

  describe("tie-breaks", () => {
    it("prefers a match first, so a repeated word is the later insertion", () => {
      expect(align(words("si ana upang"), words("si ana ana upang"))).toEqual([
        { type: "match", expected: "si", spoken: "si" },
        { type: "match", expected: "ana", spoken: "ana" },
        { type: "insertion", spoken: "ana" },
        { type: "match", expected: "upang", spoken: "upang" },
      ]);
    });

    it("prefers substitution over omission at equal cost", () => {
      expect(align(words("a b"), words("c"))).toEqual([
        { type: "substitution", expected: "a", spoken: "c" },
        { type: "omission", expected: "b" },
      ]);
    });

    it("keeps a word the learner did read when edit cost is equal", () => {
      // Both "M S S" and "M O M I" cost two edits; the second credits "c".
      expect(align(words("a b c"), words("a c d"))).toEqual([
        { type: "match", expected: "a", spoken: "a" },
        { type: "omission", expected: "b" },
        { type: "match", expected: "c", spoken: "c" },
        { type: "insertion", spoken: "d" },
      ]);
    });

    it("never trades an extra edit for an extra match", () => {
      // One substitution (1 edit) beats omission + insertion (2 edits).
      const events = align(words("a b"), words("a x"));
      expect(events.map((e) => e.type)).toEqual(["match", "substitution"]);
    });

    it("is deterministic for the same input", () => {
      const expected = words("ang bata ay nagbasa ng aklat sa silid");
      const spoken = words("ang bata nagbasa nagbasa ng libro sa silid aklatan");
      expect(align(expected, spoken)).toEqual(align(expected, spoken));
    });
  });

  it("accounts for every expected and spoken token exactly once", () => {
    const cases: Array<[string, string]> = [
      ["a b c d e", "a x c e f"],
      ["the cat sat on the mat", "the the cat on mat sat"],
      ["one", "two three four"],
      ["si ana at ang ina", "ina ang at ana si"],
    ];
    for (const [e, s] of cases) {
      const expected = words(e);
      const spoken = words(s);
      expectCoversBothSides(expected, spoken, align(expected, spoken));
    }
  });
});
