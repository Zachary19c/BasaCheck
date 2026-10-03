import type { SupportedLanguage, WordEvent } from "@/lib/types";

// Request/response shapes for the Member 2 routes:
//   POST /api/assessments               create
//   POST /api/assessments/[id]/audio    transcribe (or load the demo fixture)
//   POST /api/assessments/[id]/confirm  save the teacher-verified transcript and score reading
// Safe to import from client components.

export const MAX_RECORDING_SECONDS = 180;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const MAX_TRANSCRIPT_CHARS = 2000;

export type ApiErrorBody = {
  error: { code: string; message: string };
};

export type CreateAssessmentRequest = {
  learnerId: string;
  passageId: string;
  // Must match the stored passage language; the server rejects a mismatch.
  language: SupportedLanguage;
  // Explicit teacher choice to use the passage's prepared transcript.
  useFixture?: boolean;
};

export type CreateAssessmentResponse = {
  id: string;
  status: "recording";
  language: SupportedLanguage;
  demoTranscript: boolean;
};

// Live assessments send multipart form data: `audio` (file) and optional
// `language`. Demo assessments send no body.
export type AudioResponse = {
  id: string;
  status: "review";
  transcript: string;
  durationSeconds: number;
  demoTranscript: boolean;
};

export type ConfirmRequest = {
  verifiedTranscript: string;
};

export type ConfirmResponse = {
  id: string;
  status: "review";
  verifiedTranscript: string;
  transcriptVerifiedAt: string;
  accuracyPercent: number;
  wpm: number;
  wordEvents: WordEvent[];
};
