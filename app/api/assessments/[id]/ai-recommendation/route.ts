import { AiRecommendationError, buildRecommendationFacts, requestRecommendation } from "@/lib/ai/recommendation";
import { apiError, isUuid } from "@/lib/assessment/api";
import { type AssessmentDatabaseRow, mapAssessmentFromDatabase } from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";

const ASSESSMENT_COLUMNS =
  "id, learner_id, passage_id, language, status, transcript, verified_transcript, transcript_verified_at, demo_transcript, seeded_demo, input_mode, duration_seconds, accuracy_percent, wpm, comprehension_percent, answer_indexes, word_events, support_area, intervention_id, baseline_assessment_id, error_code, created_at";

// Optional AI explanation for one completed check. Read-only: nothing is
// saved, and the teacher still chooses the activity. If the AI fails, the
// results page keeps working without it.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return apiError(404, "assessment_not_found", "Assessment not found.");

  const supabase = createClient();
  const { data, error } = await supabase.from("assessments").select(ASSESSMENT_COLUMNS).eq("id", id).maybeSingle();
  if (error) return apiError(500, "database_error", "Could not load the assessment.");
  if (!data) return apiError(404, "assessment_not_found", "Assessment not found.");

  const assessment = mapAssessmentFromDatabase(data as AssessmentDatabaseRow);
  if (assessment.status !== "complete") {
    return apiError(409, "invalid_status", "AI recommendations appear after the three questions are answered.");
  }

  const { data: passage } = await supabase.from("passages").select("title").eq("id", assessment.passageId).maybeSingle();
  const passageTitle = (passage as { title: string } | null)?.title ?? "Reading passage";

  try {
    return Response.json(await requestRecommendation(buildRecommendationFacts(assessment, passageTitle)));
  } catch (error) {
    const aiError = error instanceof AiRecommendationError ? error : new AiRecommendationError("ai_unavailable");
    if (aiError.reason) console.warn(`AI recommendation rejected: ${aiError.reason}`);
    return apiError(aiError.status, aiError.code, aiError.message);
  }
}
