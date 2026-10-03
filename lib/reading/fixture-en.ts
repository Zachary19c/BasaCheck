import { PASSAGE_IDS } from "@/lib/content";
import type { ReadingFixture } from "@/lib/types";

// Owner: Member 3. Disclosed Demo Mode transcripts for the English passages,
// keyed by Member 1's published passage IDs (lib/content.ts, supabase/seed.sql).
//
// A fixture stands in for the speech service only. It still goes through
// teacher transcript confirmation, then the same scoreReading() engine. Its
// duration belongs to the fixture; never pair fixture words with a live
// recording's duration. Results must stay labeled as Demo Mode.

export const EN_FIRST_PASSAGE_ID = PASSAGE_IDS.mayaAndTheSeed;
export const EN_SECOND_PASSAGE_ID = PASSAGE_IDS.leosRedBall;

export const EN_FIXTURES: Readonly<Record<string, ReadingFixture>> = {
  // Maya and the Seed. Read as written; illustrative 20 s duration.
  [EN_FIRST_PASSAGE_ID]: {
    passageId: EN_FIRST_PASSAGE_ID,
    language: "en",
    transcript:
      "Maya planted a seed in a small pot. She gave it water every morning. Soon a green leaf appeared.",
    durationSeconds: 20,
  },
  // Leo's Red Ball. Read as written; illustrative 20 s duration.
  [EN_SECOND_PASSAGE_ID]: {
    passageId: EN_SECOND_PASSAGE_ID,
    language: "en",
    transcript:
      "Leo found a red ball under his chair. He shared the ball with his sister.",
    durationSeconds: 20,
  },
};
