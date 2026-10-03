import { describe, expect, it } from "vitest";
import { normalize } from "@/lib/reading";
import { matchLive, wordsMatch } from "./match";

const passage = normalize("Maagang gumising si Ana upang tulungan ang kanyang ina.");

function run(heard: string, settled?: number) {
  const words = normalize(heard);
  return matchLive(passage, words, settled ?? words.length);
}

describe("live practice matching", () => {
  it("marks words read correctly in order as green", () => {
    const result = run("Maagang gumising si Ana");
    expect(result.status.slice(0, 4)).toEqual(["correct", "correct", "correct", "correct"]);
    expect(result.status[4]).toBe("pending");
    expect(result.next).toBe(4);
  });

  it("does not count stutters, repeats or word starts as mistakes", () => {
    const result = run("ma maagang maagang gu gumising si si Ana");
    expect(result.status.slice(0, 4)).toEqual(["correct", "correct", "correct", "correct"]);
    expect(result.status).not.toContain("wrong");
  });

  it("marks a different word red and keeps going", () => {
    const result = run("Maagang kumain si Ana");
    expect(result.status.slice(0, 4)).toEqual(["correct", "wrong", "correct", "correct"]);
  });

  it("marks skipped words red when the learner jumps ahead", () => {
    const result = run("Maagang si Ana");
    expect(result.status.slice(0, 4)).toEqual(["correct", "wrong", "correct", "correct"]);
  });

  it("turns a word green again when the learner corrects it", () => {
    const result = run("Maagang kumain gumising si");
    expect(result.status.slice(0, 3)).toEqual(["correct", "correct", "correct"]);
  });

  it("ignores filler sounds between correct words", () => {
    const result = run("Maagang um gumising");
    expect(result.status.slice(0, 2)).toEqual(["correct", "correct"]);
    expect(result.status).not.toContain("wrong");
  });

  it("never marks red from words still being recognized", () => {
    const result = run("Maagang kumain", 1);
    expect(result.status.slice(0, 2)).toEqual(["correct", "pending"]);
  });

  it("keeps turning words green past a misheard word that is not final yet", () => {
    // Chrome can keep a whole sentence unconfirmed while the learner reads.
    const result = run("Maagang kumain si Ana upang", 0);
    expect(result.status.slice(0, 5)).toEqual(["correct", "pending", "correct", "correct", "correct"]);
    expect(result.next).toBe(5);
  });

  it("marks the skipped word red once the words are final", () => {
    const result = run("Maagang kumain si Ana upang");
    expect(result.status.slice(0, 5)).toEqual(["correct", "wrong", "correct", "correct", "correct"]);
  });

  it("turns the word being said green once most of it is heard", () => {
    const early = run("Maagang gumising si Ana upang tulungan ang kanya", 7);
    expect(early.status[7]).toBe("correct");
    const tooSoon = run("Maagang gumising si Ana upang tulungan ang ka", 7);
    expect(tooSoon.status[7]).toBe("pending");
  });

  it("allows small recognition spelling differences in longer words", () => {
    expect(wordsMatch("tulungan", "tulongan")).toBe(true);
    expect(wordsMatch("ina", "ana")).toBe(false);
  });
});
