import type { InterventionId, SupportedLanguage } from "@/lib/types";

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

// TODO(Member 4): fill reviewed bilingual copy for each card.
export const INTERVENTIONS: Record<InterventionId, InterventionCard> = {
  "main-idea": {
    id: "main-idea",
    title: { fil: "", en: "" },
    steps: { fil: [], en: [] },
  },
  "word-practice": {
    id: "word-practice",
    title: { fil: "", en: "" },
    steps: { fil: [], en: [] },
  },
  "repeated-reading": {
    id: "repeated-reading",
    title: { fil: "", en: "" },
    steps: { fil: [], en: [] },
  },
};
