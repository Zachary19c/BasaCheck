import { apiError, isUuid, readJsonObject } from "@/lib/assessment/api";
import { round1 } from "@/lib/comparison";
import { CHOICES_PER_QUESTION, getAnswerKeyForPassage, QUESTIONS_PER_PASSAGE } from "@/lib/questions";
import { supportArea } from "@/lib/reading/support";
import { type AssessmentDatabaseRow, mapAssessmentFromDatabase } from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";

type AssessmentForAnswers = {
  id: string;
  passage_id: string;
  status: string;
  verified_transcript: string | null;
  transcript_verified_at: string | null;
  accuracy_percent: number | string | null;
};

function readAnswerIndexes(body: Record<string, unknown> | null): number[] | null {
  const value = body?.answerIndexes;
  if (!Array.isArray(value) || value.length !== QUESTIONS_PER_PASSAGE) return null;
  const valid = value.every(
    (index) => Number.isInteger(index) && index >= 0 && index < CHOICES_PER_QUESTION,
  );
  return valid ? (value as number[]) : null;
}

// Scores the three comprehension answers against the server-only key, applies
// the demo support rule and completes the assessment. The answer key never
// leaves this route.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readJsonObject(request);
  if (!isUuid(id)) return apiError(404, "assessment_not_found", "Assessment not found.");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, passage_id, status, verified_transcript, transcript_verified_at, accuracy_percent")
    .eq("id", id)
    .maybeSingle();
  if (error) return apiError(500, "database_error", "Could not load the assessment.");
  if (!data) return apiError(404, "assessment_not_found", "Assessment not found.");

  const assessment = data as AssessmentForAnswers;
  if (assessment.status !== "review") {
    return apiError(409, "invalid_status", "This assessment is not waiting for answers.");
  }
  if (!assessment.verified_transcript || !assessment.transcript_verified_at) {
    return apiError(409, "transcript_not_confirmed", "Confirm the transcript before answering the questions.");
  }

  const answerIndexes = readAnswerIndexes(body);
  if (!answerIndexes) {
    return apiError(400, "invalid_request", "Choose one answer for each of the three questions.");
  }

  if (assessment.accuracy_percent === null) {
    return apiError(409, "reading_not_scored", "The reading has not been scored yet. Confirm the transcript first.");
  }
  const accuracyPercent = Number(assessment.accuracy_percent);

  let answerKey: number[] | null;
  try {
    answerKey = await getAnswerKeyForPassage(assessment.passage_id, supabase);
  } catch {
    return apiError(500, "database_error", "Could not load the questions.");
  }
  if (!answerKey) {
    return apiError(500, "questions_unavailable", "This passage does not have three questions.");
  }

  const key = answerKey;
  const correct = answerIndexes.filter((index, position) => index === key[position]).length;
  const comprehensionPercent = round1((correct / QUESTIONS_PER_PASSAGE) * 100);
  const support = supportArea(accuracyPercent, comprehensionPercent);

  const { data: saved, error: saveError } = await supabase
    .from("assessments")
    .update({
      answer_indexes: answerIndexes,
      comprehension_percent: comprehensionPercent,
      support_area: support,
      status: "complete",
    })
    .eq("id", id)
    .eq("status", "review")
    .select("*")
    .maybeSingle();
  if (saveError) return apiError(500, "database_error", "Could not save the answers.");
  if (!saved) return apiError(409, "invalid_status", "This assessment is not waiting for answers.");

  return Response.json(mapAssessmentFromDatabase(saved as AssessmentDatabaseRow));
}
