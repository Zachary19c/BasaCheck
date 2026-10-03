import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { SupportedLanguage } from "@/lib/types";
import { EN_FIXTURES } from "./fixture-en";
import { FIL_FIXTURES, FIL_PRIMARY_PASSAGE_ID } from "./fixture-fil";
import { findReadingFixture, READING_FIXTURES } from "./fixtures";
import { scoreReading } from "./metrics";
import { normalize } from "./normalize";

// Read passages from Member 1's seed so fixtures cannot drift from content.
type SeedPassage = { id: string; title: string; content: string; language: SupportedLanguage };

function readSeedPassages(): SeedPassage[] {
  const seed = readFileSync(
    fileURLToPath(new URL("../../supabase/seed.sql", import.meta.url)),
    "utf8",
  );
  const tuple =
    /'([0-9a-f-]{36})'::uuid,\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'(fil|en)'/g;
  const unquote = (s: string) => s.replaceAll("''", "'");
  return [...seed.matchAll(tuple)].map((m) => ({
    id: m[1],
    title: unquote(m[2]),
    content: unquote(m[3]),
    language: m[4] as SupportedLanguage,
  }));
}

const passages = readSeedPassages();

describe("reading fixtures", () => {
  it("finds the seeded passages, with matching Filipino and English sets", () => {
    expect(passages).toHaveLength(12);
    expect(passages.filter((p) => p.language === "fil")).toHaveLength(6);
    expect(passages.filter((p) => p.language === "en")).toHaveLength(6);
  });

  it("has exactly one fixture per seeded passage, keyed by passage ID with matching language", () => {
    expect(Object.keys(READING_FIXTURES).sort()).toEqual(passages.map((p) => p.id).sort());
    for (const passage of passages) {
      const fixture = READING_FIXTURES[passage.id];
      expect(fixture.passageId).toBe(passage.id);
      expect(fixture.language).toBe(passage.language);
      expect(Number.isFinite(fixture.durationSeconds) && fixture.durationSeconds > 0).toBe(true);
    }
  });

  it("keeps each language file to its own language", () => {
    expect(Object.values(FIL_FIXTURES).every((f) => f.language === "fil")).toBe(true);
    expect(Object.values(EN_FIXTURES).every((f) => f.language === "en")).toBe(true);
  });

  it("primary Filipino fixture scores 59/60 and 60 WPM against the seeded passage", () => {
    const passage = passages.find((p) => p.id === FIL_PRIMARY_PASSAGE_ID)!;
    const fixture = READING_FIXTURES[FIL_PRIMARY_PASSAGE_ID];
    expect(passage.title).toBe("Si Ana at ang Ina");
    expect(normalize(passage.content)).toHaveLength(60);

    const result = scoreReading({
      expectedText: passage.content,
      transcript: fixture.transcript,
      durationSeconds: fixture.durationSeconds,
    });
    expect(result.accuracyPercent).toBe((59 * 100) / 60);
    expect(result.wpm).toBe(60);
    expect(result.events.filter((e) => e.type !== "match")).toEqual([
      { type: "substitution", expected: "upang", spoken: "para" },
    ]);
  });

  it("other fixtures are their passage read as written", () => {
    for (const passage of passages.filter((p) => p.id !== FIL_PRIMARY_PASSAGE_ID)) {
      const fixture = READING_FIXTURES[passage.id];
      expect(normalize(fixture.transcript)).toEqual(normalize(passage.content));
      const result = scoreReading({
        expectedText: passage.content,
        transcript: fixture.transcript,
        durationSeconds: fixture.durationSeconds,
      });
      expect(result.accuracyPercent).toBe(100);
      expect(result.wpm).toBe((normalize(passage.content).length * 60) / fixture.durationSeconds);
    }
  });
});

describe("findReadingFixture", () => {
  it("returns the fixture only for the exact passage and language", () => {
    for (const passage of passages) {
      expect(findReadingFixture(passage.id, passage.language)).toBe(READING_FIXTURES[passage.id]);
      const other: SupportedLanguage = passage.language === "fil" ? "en" : "fil";
      expect(findReadingFixture(passage.id, other)).toBeNull();
    }
  });

  it("returns null for unknown passages instead of substituting another fixture", () => {
    expect(findReadingFixture("10000000-0000-4000-8000-000000000099", "fil")).toBeNull();
    expect(findReadingFixture("", "en")).toBeNull();
    for (const key of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      expect(findReadingFixture(key, "fil")).toBeNull();
    }
  });
});
