import { apiError, isUuid, readJsonObject } from "@/lib/assessment/api";
import { isInterventionId } from "@/lib/interventions";
import { type AssessmentDatabaseRow, mapAssessmentFromDatabase } from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";

// Saves the teacher's chosen activity on a completed assessment. Writes
// intervention_id only: no follow-up row, no change to scores or support.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readJsonObject(request);
  const interventionId = body?.interventionId;
  if (!isInterventionId(interventionId)) {
    return apiError(400, "invalid_request", "Choose main-idea, word-practice or repeated-reading.");
  }
  if (!isUuid(id)) return apiError(404, "assessment_not_found", "Assessment not found.");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (error) return apiError(500, "database_error", "Could not load the assessment.");
  if (!data) return apiError(404, "assessment_not_found", "Assessment not found.");
  if ((data as { status: string }).status !== "complete") {
    return apiError(409, "invalid_status", "Finish the assessment before choosing an activity.");
  }

  const { data: saved, error: saveError } = await supabase
    .from("assessments")
    .update({ intervention_id: interventionId })
    .eq("id", id)
    .eq("status", "complete")
    .select("*")
    .maybeSingle();
  if (saveError) return apiError(500, "database_error", "Could not save the activity.");
  if (!saved) return apiError(409, "invalid_status", "Finish the assessment before choosing an activity.");

  return Response.json(mapAssessmentFromDatabase(saved as AssessmentDatabaseRow));
}
