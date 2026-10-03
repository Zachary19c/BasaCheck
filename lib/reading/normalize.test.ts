import { describe, expect, it } from "vitest";
import { normalize } from "./normalize";

const PRIMARY_PASSAGE =
  "Maagang gumising si Ana upang tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.";

describe("normalize", () => {
  it("lowercases, strips punctuation and splits on whitespace", () => {
    expect(normalize("Maagang gumising si Ana!")).toEqual([
      "maagang",
      "gumising",
      "si",
      "ana",
    ]);
  });

  it("counts the Grade 2 Filipino passage as 60 tokens, with one upang", () => {
    const tokens = normalize(PRIMARY_PASSAGE);
    expect(tokens).toHaveLength(60);
    expect(tokens.slice(0, 5)).toEqual(["maagang", "gumising", "si", "ana", "upang"]);
    expect(tokens.filter((token) => token === "upang")).toEqual(["upang"]);
  });

  it("deletes punctuation inside words instead of splitting, like seed.sql", () => {
    expect(normalize("Leo's red ball")).toEqual(["leos", "red", "ball"]);
    expect(normalize("mag-aral tayo")).toEqual(["magaral", "tayo"]);
  });

  it("removes ASCII symbols the same way POSIX [[:punct:]] does", () => {
    expect(normalize("a $ b + c = d")).toEqual(["a", "b", "c", "d"]);
    expect(normalize("a+b")).toEqual(["ab"]);
  });

  it("removes Unicode punctuation such as curly quotes and ellipses", () => {
    expect(normalize("“Ana,” sabi niya…")).toEqual(["ana", "sabi", "niya"]);
  });

  it("collapses any whitespace and never yields empty tokens", () => {
    expect(normalize("  si\tAna\n\nat   ang  Ina  ")).toEqual(["si", "ana", "at", "ang", "ina"]);
    expect(normalize("si Ana , at")).toEqual(["si", "ana", "at"]);
  });

  it("keeps letters such as ñ and treats composed and decomposed accents alike", () => {
    expect(normalize("Niño")).toEqual(["niño"]);
    expect(normalize("Nin\u0303o")).toEqual(normalize("Ni\u00f1o"));
  });

  it("returns no tokens for empty or punctuation-only text", () => {
    expect(normalize("")).toEqual([]);
    expect(normalize("   ")).toEqual([]);
    expect(normalize("... ! ?")).toEqual([]);
  });

  it("rejects non-string input", () => {
    expect(() => normalize(undefined as unknown as string)).toThrow(TypeError);
  });
});
