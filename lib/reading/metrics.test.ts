import { describe, expect, it } from "vitest";
import { comprehension, ReadingInputError, scoreReading } from "./metrics";
import { normalize } from "./normalize";

const PRIMARY_PASSAGE =
  "Maagang gumising si Ana upang tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.";
const PARA_READING = PRIMARY_PASSAGE.replace("upang", "para");

function expectInputError(fn: () => unknown, code: ReadingInputError["code"]) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ReadingInputError);
    expect((error as ReadingInputError).code).toBe(code);
    return;
  }
  throw new Error(`Expected ReadingInputError ${code}`);
}

describe("scoreReading", () => {
  it("scores an identical reading as 100% with only matches", () => {
    const result = scoreReading({
      expectedText: PRIMARY_PASSAGE,
      transcript: PRIMARY_PASSAGE,
      durationSeconds: 20,
    });
    expect(result.accuracyPercent).toBe(100);
    expect(result.events).toHaveLength(19);
    expect(result.events.every((e) => e.type === "match")).toBe(true);
  });

  it("gives 18/19 when only upang is read as para", () => {
    const result = scoreReading({
      expectedText: PRIMARY_PASSAGE,
      transcript: PARA_READING,
      durationSeconds: 20,
    });
    expect(result.accuracyPercent).toBe((18 * 100) / 19);
    expect(result.accuracyPercent).toBeCloseTo(94.74, 2);
    expect(result.events.filter((e) => e.type !== "match")).toEqual([
      { type: "substitution", expected: "upang", spoken: "para" },
    ]);
  });

  it("matches the word events seed.sql writes for the seeded baseline", () => {
    const { events } = scoreReading({
      expectedText: PRIMARY_PASSAGE,
      transcript: PARA_READING,
      durationSeconds: 20,
    });
    expect(events).toEqual(
      normalize(PRIMARY_PASSAGE).map((token) =>
        token === "upang"
          ? { type: "substitution", expected: "upang", spoken: "para" }
          : { type: "match", expected: token, spoken: token },
      ),
    );
  });

  it("gives 57 WPM for 19 spoken words in 20 seconds", () => {
    const result = scoreReading({
      expectedText: PRIMARY_PASSAGE,
      transcript: PARA_READING,
      durationSeconds: 20,
    });
    expect(result.wpm).toBe(57);
  });

  it("shows insertions without lowering accuracy, and counts them as spoken words", () => {
    const result = scoreReading({
      expectedText: PRIMARY_PASSAGE,
      transcript: PRIMARY_PASSAGE.replace("si Ana", "si Ana Ana"),
      durationSeconds: 20,
    });
    expect(result.accuracyPercent).toBe(100);
    expect(result.events.filter((e) => e.type === "insertion")).toEqual([
      { type: "insertion", spoken: "ana" },
    ]);
    expect(result.wpm).toBe((20 * 60) / 20);
  });

  it("lowers accuracy for an omission and uses only spoken words for rate", () => {
    const result = scoreReading({
      expectedText: PRIMARY_PASSAGE,
      transcript: PRIMARY_PASSAGE.replace("ang kanyang ina", "ang ina"),
      durationSeconds: 20,
    });
    expect(result.accuracyPercent).toBe((18 * 100) / 19);
    expect(result.events.filter((e) => e.type === "omission")).toEqual([
      { type: "omission", expected: "kanyang" },
    ]);
    expect(result.wpm).toBe((18 * 60) / 20);
  });

  it("recomputes measurements from a teacher-corrected transcript", () => {
    const asr = PRIMARY_PASSAGE.replace("tulungan", "tulungin").replace("upang", "para");
    const before = scoreReading({ expectedText: PRIMARY_PASSAGE, transcript: asr, durationSeconds: 20 });
    const after = scoreReading({ expectedText: PRIMARY_PASSAGE, transcript: PARA_READING, durationSeconds: 20 });
    expect(before.accuracyPercent).toBe((17 * 100) / 19);
    expect(after.accuracyPercent).toBe((18 * 100) / 19);
  });

  it("keeps values unrounded and exact at whole-number boundaries", () => {
    const tenWords = "isa dalawa tatlo apat lima anim pito walo siyam sampu";
    const result = scoreReading({
      expectedText: tenWords,
      transcript: tenWords.replace("sampu", "labing"),
      durationSeconds: 7,
    });
    expect(result.accuracyPercent).toBe(90);
    expect(result.wpm).toBe((10 * 60) / 7);
  });

  it("rejects empty expected text", () => {
    for (const expectedText of ["", "   ", "...!?"]) {
      expectInputError(
        () => scoreReading({ expectedText, transcript: PARA_READING, durationSeconds: 20 }),
        "empty_expected_text",
      );
    }
  });

  it("rejects an empty verified transcript", () => {
    for (const transcript of ["", "   ", ". , !", undefined as unknown as string]) {
      expectInputError(
        () => scoreReading({ expectedText: PRIMARY_PASSAGE, transcript, durationSeconds: 20 }),
        "empty_transcript",
      );
    }
  });

  it("rejects nonpositive or non-finite duration", () => {
    for (const durationSeconds of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, "20" as unknown as number]) {
      expectInputError(
        () => scoreReading({ expectedText: PRIMARY_PASSAGE, transcript: PARA_READING, durationSeconds }),
        "invalid_duration",
      );
    }
  });
});

describe("comprehension", () => {
  it("scores correct answers over the question total", () => {
    expect(comprehension(0, 3)).toBe(0);
    expect(comprehension(1, 3)).toBeCloseTo(33.33, 2);
    expect(comprehension(3, 3)).toBe(100);
  });

  it("rejects impossible counts", () => {
    expect(() => comprehension(4, 3)).toThrow(RangeError);
    expect(() => comprehension(-1, 3)).toThrow(RangeError);
    expect(() => comprehension(1.5, 3)).toThrow(RangeError);
    expect(() => comprehension(0, 0)).toThrow(RangeError);
    expect(() => comprehension(Number.NaN, 3)).toThrow(RangeError);
  });
});
