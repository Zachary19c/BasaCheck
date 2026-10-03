import type { ReadingFixture, SupportedLanguage } from "@/lib/types";
import { EN_FIXTURES } from "./fixture-en";
import { FIL_FIXTURES } from "./fixture-fil";

// Owner: Member 3. Passage-keyed fixture lookup for Demo Mode (Member 2's
// audio route). Fixtures are matched by passage ID, never by language alone.

export const READING_FIXTURES: Readonly<Record<string, ReadingFixture>> = {
  ...FIL_FIXTURES,
  ...EN_FIXTURES,
};

// Returns the fixture for exactly this passage and language, or null when Demo
// Mode is unavailable for it. Pass the passage ID and language stored on the
// assessment row, not client-supplied values. A null result means: show
// "Demo Mode unavailable for this passage"; never substitute another fixture.
export function findReadingFixture(
  passageId: string,
  language: SupportedLanguage,
): ReadingFixture | null {
  if (typeof passageId !== "string" || !Object.hasOwn(READING_FIXTURES, passageId)) {
    return null;
  }

  const fixture = READING_FIXTURES[passageId];
  if (fixture.passageId !== passageId || fixture.language !== language) {
    return null;
  }

  return fixture;
}
