// Shared contract types. See docs/04-tech-stack.md and docs/05-team-split.md.
// Change only by team agreement.

export type SupportedLanguage = "fil" | "en";

export type SupportArea = "accuracy" | "comprehension";

export type AssessmentStatus =
  | "recording"
  | "processing"
  | "review"
  | "complete"
  | "error";

// speech: microphone or a prepared fixture. tap: teacher-marked words, no recording.
export type InputMode = "speech" | "tap";

export type InterventionId = "main-idea" | "word-practice" | "repeated-reading";

export type WordEvent = {
  type: "match" | "substitution" | "omission" | "insertion";
  expected?: string;
  spoken?: string;
};

export type AssessmentRow = {
  id: string;
  learnerId: string;
  passageId: string;
  language: SupportedLanguage;
  status: AssessmentStatus;
  transcript: string | null;
  verifiedTranscript: string | null;
  transcriptVerifiedAt: string | null;
  demoTranscript: boolean;
  seededDemo: boolean;
  inputMode: InputMode;
  durationSeconds: number | null;
  accuracyPercent: number | null;
  wpm: number | null;
  comprehensionPercent: number | null;
  answerIndexes: number[] | null;
  wordEvents: WordEvent[];
  supportArea: SupportArea | null;
  interventionId: InterventionId | null;
  baselineAssessmentId: string | null;
  errorCode: string | null;
  createdAt: string;
};

// Response from the local speech service POST /transcribe.
export type TranscribeResponse = {
  transcript: string;
  durationSeconds: number;
};

// Demo fixture, keyed by passage ID in lib/reading/fixture-*.ts.
export type ReadingFixture = {
  passageId: string;
  language: SupportedLanguage;
  transcript: string;
  durationSeconds: number;
};
