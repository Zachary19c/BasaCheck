import type {
  AssessmentRow,
  AssessmentStatus,
  InputMode,
  InterventionId,
  SupportedLanguage,
  SupportArea,
  WordEvent,
} from "@/lib/types";

type DatabaseNumeric = number | string;

export type AssessmentDatabaseRow = {
  id: string;
  learner_id: string;
  passage_id: string;
  language: SupportedLanguage;
  status: AssessmentStatus;
  transcript: string | null;
  verified_transcript: string | null;
  transcript_verified_at: string | null;
  demo_transcript: boolean;
  seeded_demo: boolean;
  input_mode?: InputMode;
  duration_seconds: DatabaseNumeric | null;
  accuracy_percent: DatabaseNumeric | null;
  wpm: DatabaseNumeric | null;
  comprehension_percent: DatabaseNumeric | null;
  answer_indexes: number[] | null;
  word_events: WordEvent[];
  support_area: SupportArea | null;
  intervention_id: InterventionId | null;
  baseline_assessment_id: string | null;
  error_code: string | null;
  created_at: string;
};

function mapNullableNumber(
  value: DatabaseNumeric | null,
  column: string,
): number | null {
  if (value === null) return null;

  const mapped = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(mapped)) {
    throw new TypeError(`Invalid numeric value in assessments.${column}`);
  }

  return mapped;
}

export function mapAssessmentFromDatabase(
  row: AssessmentDatabaseRow,
): AssessmentRow {
  return {
    id: row.id,
    learnerId: row.learner_id,
    passageId: row.passage_id,
    language: row.language,
    status: row.status,
    transcript: row.transcript,
    verifiedTranscript: row.verified_transcript,
    transcriptVerifiedAt: row.transcript_verified_at,
    demoTranscript: row.demo_transcript,
    seededDemo: row.seeded_demo,
    inputMode: row.input_mode === "tap" ? "tap" : "speech",
    durationSeconds: mapNullableNumber(row.duration_seconds, "duration_seconds"),
    accuracyPercent: mapNullableNumber(row.accuracy_percent, "accuracy_percent"),
    wpm: mapNullableNumber(row.wpm, "wpm"),
    comprehensionPercent: mapNullableNumber(
      row.comprehension_percent,
      "comprehension_percent",
    ),
    answerIndexes: row.answer_indexes,
    wordEvents: row.word_events,
    supportArea: row.support_area,
    interventionId: row.intervention_id,
    baselineAssessmentId: row.baseline_assessment_id,
    errorCode: row.error_code,
    createdAt: row.created_at,
  };
}

export function mapAssessmentToDatabase(
  row: AssessmentRow,
): AssessmentDatabaseRow {
  return {
    id: row.id,
    learner_id: row.learnerId,
    passage_id: row.passageId,
    language: row.language,
    status: row.status,
    transcript: row.transcript,
    verified_transcript: row.verifiedTranscript,
    transcript_verified_at: row.transcriptVerifiedAt,
    demo_transcript: row.demoTranscript,
    seeded_demo: row.seededDemo,
    input_mode: row.inputMode,
    duration_seconds: row.durationSeconds,
    accuracy_percent: row.accuracyPercent,
    wpm: row.wpm,
    comprehension_percent: row.comprehensionPercent,
    answer_indexes: row.answerIndexes,
    word_events: row.wordEvents,
    support_area: row.supportArea,
    intervention_id: row.interventionId,
    baseline_assessment_id: row.baselineAssessmentId,
    error_code: row.errorCode,
    created_at: row.createdAt,
  };
}
