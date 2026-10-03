// Owner: Member 3. Public entry point for the reading engine: import from
// "@/lib/reading". Everything here is pure and safe on server or client.

export { normalize } from "./normalize";
export { align } from "./align";
export {
  comprehension,
  ReadingInputError,
  scoreReading,
  type ReadingInputErrorCode,
  type ReadingScore,
  type ReadingScoreInput,
} from "./metrics";
export {
  DEMO_ACCURACY_THRESHOLD,
  DEMO_COMPREHENSION_THRESHOLD,
  supportArea,
} from "./support";
export { EN_FIXTURES } from "./fixture-en";
export { FIL_FIXTURES } from "./fixture-fil";
export { findReadingFixture, READING_FIXTURES } from "./fixtures";
