import type { WordEvent } from "@/lib/types";
import { align } from "./align";
import { normalize } from "./normalize";

// Owner: Member 3. Deterministic reading measurements. Pure: no auth, database
// or model imports. Values are returned unrounded; round only for display.
//
// Passage Reading Accuracy = aligned matches / expected token count x 100.
//   Insertions are reported as events but do not reduce this percentage.
// Reading Rate (WPM) = verified spoken token count x 60 / recording seconds.
//   Includes pauses and lead/trail time; it is not a fluency diagnosis.
// Comprehension = correct answers / total questions x 100.
//
// Multiplying before dividing keeps whole-number results exact (e.g. 9/10 is
// exactly 90), so the support rule's boundaries behave predictably.

export type ReadingInputErrorCode =
  | "empty_expected_text"
  | "empty_transcript"
  | "invalid_duration";

// Thrown for input that must not produce a reading score. Routes should map
// this to a validation error and store no reading metrics.
export class ReadingInputError extends Error {
  readonly code: ReadingInputErrorCode;

  constructor(code: ReadingInputErrorCode, message: string) {
    super(message);
    this.name = "ReadingInputError";
    this.code = code;
  }
}

export type ReadingScoreInput = {
  expectedText: string;
  // Teacher-confirmed spoken text only. Never the unverified ASR transcript.
  transcript: string;
  durationSeconds: number;
};

export type ReadingScore = {
  accuracyPercent: number;
  wpm: number;
  events: WordEvent[];
};

export function scoreReading(input: ReadingScoreInput): ReadingScore {
  const { expectedText, transcript, durationSeconds } = input;

  const expected = typeof expectedText === "string" ? normalize(expectedText) : [];
  if (expected.length === 0) {
    throw new ReadingInputError(
      "empty_expected_text",
      "Expected passage text has no words to score against.",
    );
  }

  const spoken = typeof transcript === "string" ? normalize(transcript) : [];
  if (spoken.length === 0) {
    throw new ReadingInputError(
      "empty_transcript",
      "Verified transcript has no words to score.",
    );
  }

  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    throw new ReadingInputError(
      "invalid_duration",
      "Recording duration must be a positive, finite number of seconds.",
    );
  }

  const events = align(expected, spoken);
  const matches = events.filter((event) => event.type === "match").length;

  return {
    accuracyPercent: (matches * 100) / expected.length,
    wpm: (spoken.length * 60) / durationSeconds,
    events,
  };
}

export function comprehension(correct: number, total: number): number {
  if (!Number.isInteger(total) || total <= 0) {
    throw new RangeError("Question total must be a positive integer.");
  }
  if (!Number.isInteger(correct) || correct < 0 || correct > total) {
    throw new RangeError("Correct answers must be an integer from 0 to total.");
  }

  return (correct * 100) / total;
}
