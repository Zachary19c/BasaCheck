import { PASSAGE_IDS } from "@/lib/content";
import type { ReadingFixture } from "@/lib/types";

// Owner: Member 3. Disclosed Demo Mode transcripts for the Filipino passages,
// keyed by Member 1's published passage IDs (lib/content.ts, supabase/seed.sql).
//
// A fixture stands in for the speech service only. It still goes through
// teacher transcript confirmation, then the same scoreReading() engine. Its
// duration belongs to the fixture; never pair fixture words with a live
// recording's duration. Results must stay labeled as Demo Mode.

export const FIL_PRIMARY_PASSAGE_ID = PASSAGE_IDS.siAnaAtAngIna;
export const FIL_SECOND_PASSAGE_ID = PASSAGE_IDS.siBenAtAngAso;

export const FIL_FIXTURES: Readonly<Record<string, ReadingFixture>> = {
  // Si Ana at ang Ina. Only "upang" is read as "para" (docs/01-mvp-prd.md):
  // 19 tokens, 18/19 matches (~94.74%), 19 tokens in 20 s = 57 WPM.
  [FIL_PRIMARY_PASSAGE_ID]: {
    passageId: FIL_PRIMARY_PASSAGE_ID,
    language: "fil",
    transcript:
      "Maagang gumising si Ana para tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.",
    durationSeconds: 20,
  },
  // Si Ben at ang Aso. Read as written; illustrative 20 s duration.
  [FIL_SECOND_PASSAGE_ID]: {
    passageId: FIL_SECOND_PASSAGE_ID,
    language: "fil",
    transcript:
      "Si Ben ay may maliit na aso. Tuwing hapon, naglalaro sila sa bakuran. Pagkatapos, binibigyan niya ito ng tubig.",
    durationSeconds: 20,
  },
};
