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
  // Maya and the Seed. Read as written. 32 tokens in 32 s = 60 WPM.
  [EN_FIRST_PASSAGE_ID]: {
    passageId: EN_FIRST_PASSAGE_ID,
    language: "en",
    transcript:
      "Maya planted a seed in a small pot. She put the pot by the window. She gave it water every morning. Soon a green leaf appeared. Maya smiled at her little plant.",
    durationSeconds: 32,
  },
  // Leo's Red Ball. Read as written. 30 tokens in 30 s = 60 WPM.
  [EN_SECOND_PASSAGE_ID]: {
    passageId: EN_SECOND_PASSAGE_ID,
    language: "en",
    transcript:
      "Leo found a red ball under his chair. He looked around the room. His sister had no toy. Leo shared the ball with his sister. They played in the yard.",
    durationSeconds: 30,
  },
  [PASSAGE_IDS.lizaAndTheMorningBell]: {
    passageId: PASSAGE_IDS.lizaAndTheMorningBell,
    language: "en",
    transcript:
      "Liza woke up late on Monday. She washed her face and put on her uniform. Her father waited at the gate with her lunch. \"The jeep is almost full,\" he said. They rode through the busy street. At school, the bell was already ringing. Liza hurried to her classroom. Her teacher smiled and pointed to a chair. Liza sat down and opened her notebook. She was late, but she was ready to learn.",
    durationSeconds: 73,
  },
  [PASSAGE_IDS.theClassGarden]: {
    passageId: PASSAGE_IDS.theClassGarden,
    language: "en",
    transcript:
      "The class planted pechay in a wooden box. Every morning, Paolo checked the soil. If it felt dry, he poured water from a small can. After two weeks, green leaves pushed out of the ground. One hot day, the leaves began to droop. Paolo moved the box under a tree. The next morning, the plants stood up again. The class learned that plants need water, light, and care. On Friday, they shared the first leaves with the canteen.",
    durationSeconds: 78,
  },
  [PASSAGE_IDS.howRainReturns]: {
    passageId: PASSAGE_IDS.howRainReturns,
    language: "en",
    transcript:
      "Rain does not appear from nothing. The sun heats water in rivers, lakes, and the sea. Some of that water becomes vapor, which is water in the form of a gas. The vapor rises and cools high in the air. Tiny drops then gather into clouds. When the drops become heavy, they fall as rain. The rain flows back to streams and the sea, and the cycle begins again. This movement is called the water cycle. It matters because plants, animals, and people all need fresh water. If people throw waste into a river, that waste can travel with the water. Keeping rivers clean helps the water we drink and the rain that falls on our fields. Cities also store rain in dams so homes have water during a dry month.",
    durationSeconds: 131,
  },
  [PASSAGE_IDS.whyTheMoonChangesShape]: {
    passageId: PASSAGE_IDS.whyTheMoonChangesShape,
    language: "en",
    transcript:
      "The moon does not make its own light. We see it because sunlight bounces off its surface. As the moon travels around Earth, we see different parts of its lit side. That is why the moon can look like a thin curve, a half circle, or a full bright disk. These views are called phases. A full moon is not larger than a crescent moon. We simply see more of the side that the sun is lighting. The moon's shape in the sky is a clue to where it is on its path around Earth. Scientists use that path to predict the tides and to plan night observations. You can draw the moon each night for a month. The drawings show a pattern that repeats about every twenty-nine days.",
    durationSeconds: 129,
  },
};
