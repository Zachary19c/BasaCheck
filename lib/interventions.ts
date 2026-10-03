import type { InterventionId, SupportArea, SupportedLanguage } from "@/lib/types";

// Owner: Member 4. Bilingual card copy lives here, not in the database.

export const INTERVENTION_IDS = [
  "main-idea",
  "word-practice",
  "repeated-reading",
] as const satisfies readonly InterventionId[];

export type InterventionCard = {
  id: InterventionId;
  title: Record<SupportedLanguage, string>;
  steps: Record<SupportedLanguage, string[]>;
};

export const INTERVENTIONS: Record<InterventionId, InterventionCard> = {
  "main-idea": {
    id: "main-idea",
    title: { fil: "Hanapin ang Pangunahing Ideya", en: "Finding the Main Idea" },
    steps: {
      en: [
        "Read a short paragraph together.",
        "Ask what the paragraph is mostly about.",
        "Have the learner choose the main idea and explain why.",
      ],
      fil: [
        "Basahin nang sabay ang isang maikling talata.",
        "Itanong kung tungkol saan ang talata.",
        "Ipapili sa mag-aaral ang pangunahing ideya at ipaliwanag kung bakit.",
      ],
    },
  },
  "word-practice": {
    id: "word-practice",
    title: { fil: "Pagsasanay sa mga Salita", en: "Word Practice" },
    steps: {
      en: [
        "Choose a few familiar words from the passage and model each one.",
        "Practice each word in a short phrase.",
        "Reread the passage together.",
      ],
      fil: [
        "Pumili ng ilang kilalang salita mula sa kuwento at basahin ang bawat isa bilang halimbawa.",
        "Sanayin ang bawat salita sa isang maikling parirala.",
        "Basahin muli nang sabay ang kuwento.",
      ],
    },
  },
  "repeated-reading": {
    id: "repeated-reading",
    title: { fil: "Paulit-ulit na Pagbasa", en: "Repeated Reading" },
    steps: {
      en: [
        "Model reading a short passage aloud.",
        "Read the passage together.",
        "Let the learner reread it, then talk about what it means.",
      ],
      fil: [
        "Basahin nang malakas ang isang maikling kuwento bilang halimbawa.",
        "Basahin ito nang sabay.",
        "Hayaang basahin muli ng mag-aaral, saka pag-usapan ang kahulugan.",
      ],
    },
  },
};

export function isInterventionId(value: unknown): value is InterventionId {
  return typeof value === "string" && (INTERVENTION_IDS as readonly string[]).includes(value);
}

// Demo rule only: maps the support area to a suggested card. Null support
// means no automatic suggestion. Repeated reading is never auto-suggested.
export function suggestedIntervention(support: SupportArea | null): InterventionId | null {
  if (support === "comprehension") return "main-idea";
  if (support === "accuracy") return "word-practice";
  return null;
}
