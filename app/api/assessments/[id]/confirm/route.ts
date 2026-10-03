import { apiError, isUuid, readJsonObject } from "@/lib/assessment/api";
import { type ConfirmResponse, MAX_TRANSCRIPT_CHARS } from "@/lib/assessment/contract";
import {
  findReadingFixture,
  ReadingInputError,
  type ReadingScore,
  scoreReading,
} from "@/lib/reading";
import { createClient } from "@/lib/supabase/server";
import type { SupportedLanguage } from "@/lib/types";

type AssessmentForConfirm = {
  id: string;
  passage_id: string;
  language: SupportedLanguage;
  status: string;
  transcript: string | null;
  duration_seconds: number | string | null;
  demo_transcript: boolean;
};

// Saves the teacher-verified transcript and scores reading. This is the only
// route that calls scoreReading. Confirming again before the answers are
// submitted replaces the verified text and recomputes the measurements.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return apiError(404, "assessment_not_found", "Assessment not found.");

  const body = await readJsonObject(request);
  if (!body || typeof body.verifiedTranscript !== "string") {
    return apiError(400, "invalid_request", "Send verifiedTranscript as text.");
  }
  const verifiedTranscript = body.verifiedTranscript.trim();
  if (!verifiedTranscript) {
    return apiError(422, "empty_transcript", "Type what the learner said before confirming.");
  }
  if (verifiedTranscript.length > MAX_TRANSCRIPT_CHARS) {
    return apiError(422, "transcript_too_long", "The transcript is too long for this passage.");
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, passage_id, language, status, transcript, duration_seconds, demo_transcript")
    .eq("id", id)
    .maybeSingle();
  if (error) return apiError(500, "database_error", "Could not load the assessment.");
  if (!data) return apiError(404, "assessment_not_found", "Assessment not found.");

  const assessment = data as AssessmentForConfirm;
  if (assessment.status !== "review" || assessment.transcript === null) {
    return apiError(409, "invalid_status", "This assessment is not waiting for transcript review.");
  }

  const durationSeconds = Number(assessment.duration_seconds);
  if (assessment.duration_seconds === null || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return apiError(422, "invalid_duration", "This recording has no valid duration. Record again.");
  }

  const { data: passage, error: passageError } = await supabase
    .from("passages")
    .select("id, content, language")
    .eq("id", assessment.passage_id)
    .maybeSingle();
  if (passageError) return apiError(500, "database_error", "Could not load the passage.");
  if (!passage) return apiError(404, "passage_not_found", "Passage not found.");
  if (passage.language !== assessment.language) {
    return apiError(409, "language_mismatch", "The passage language does not match this assessment.");
  }

  // A demo transcript must belong to this passage and keep the fixture's own duration.
  if (assessment.demo_transcript) {
    const fixture = findReadingFixture(assessment.passage_id, assessment.language);
    if (!fixture || fixture.durationSeconds !== durationSeconds) {
      return apiError(
        409,
        "fixture_mismatch",
        "The prepared transcript does not match this passage, so it cannot be scored.",
      );
    }
  }

  let score: ReadingScore;
  try {
    score = scoreReading({
      expectedText: passage.content as string,
      transcript: verifiedTranscript,
      durationSeconds,
    });
  } catch (error) {
    if (!(error instanceof ReadingInputError)) throw error;
    if (error.code === "empty_transcript") {
      return apiError(422, "empty_transcript", "The transcript has no words to compare. Type what the learner said.");
    }
    if (error.code === "invalid_duration") {
      return apiError(422, "invalid_duration", "This recording has no valid duration. Record again.");
    }
    return apiError(422, "invalid_reading_input", "This passage has no words to score against.");
  }

  const transcriptVerifiedAt = new Date().toISOString();
  const { data: saved, error: saveError } = await supabase
    .from("assessments")
    .update({
      verified_transcript: verifiedTranscript,
      transcript_verified_at: transcriptVerifiedAt,
      accuracy_percent: score.accuracyPercent,
      wpm: score.wpm,
      word_events: score.events,
    })
    .eq("id", id)
    .eq("status", "review")
    .select("id")
    .maybeSingle();
  if (saveError) return apiError(500, "database_error", "Could not save the transcript.");
  if (!saved) return apiError(409, "invalid_status", "This assessment is not waiting for transcript review.");

  const response: ConfirmResponse = {
    id,
    status: "review",
    verifiedTranscript,
    transcriptVerifiedAt,
    accuracyPercent: score.accuracyPercent,
    wpm: score.wpm,
    wordEvents: score.events,
  };
  return Response.json(response);
}
