import { apiError, isUuid, readJsonObject } from "@/lib/assessment/api";
import type { CreateAssessmentResponse } from "@/lib/assessment/contract";
import { isDemoMode } from "@/lib/demo-mode";
import { findReadingFixture } from "@/lib/reading";
import { createClient } from "@/lib/supabase/server";
import type { SupportedLanguage } from "@/lib/types";

// Starts a new assessment (status `recording`) for one learner and one active
// passage. The stored language always comes from the passage; a client value
// that disagrees is rejected. Demo assessments are labeled from creation.
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return apiError(400, "invalid_request", "Send a JSON body.");

  const { learnerId, passageId, language, useFixture, inputMode } = body;
  if (!isUuid(learnerId) || !isUuid(passageId)) {
    return apiError(400, "invalid_request", "learnerId and passageId must be valid IDs.");
  }
  if (language !== "fil" && language !== "en") {
    return apiError(400, "invalid_request", "language must be fil or en.");
  }
  if (useFixture !== undefined && typeof useFixture !== "boolean") {
    return apiError(400, "invalid_request", "useFixture must be true or false.");
  }
  if (inputMode !== undefined && inputMode !== "speech" && inputMode !== "tap") {
    return apiError(400, "invalid_request", "inputMode must be speech or tap.");
  }
  if (inputMode === "tap" && useFixture === true) {
    return apiError(400, "invalid_request", "An offline tap does not use a prepared transcript.");
  }

  const supabase = createClient();

  const { data: learner, error: learnerError } = await supabase
    .from("learners")
    .select("id")
    .eq("id", learnerId)
    .maybeSingle();
  if (learnerError) return apiError(500, "database_error", "Could not load the learner.");
  if (!learner) return apiError(404, "learner_not_found", "Learner not found.");

  const { data: passage, error: passageError } = await supabase
    .from("passages")
    .select("id, language")
    .eq("id", passageId)
    .eq("is_active", true)
    .maybeSingle();
  if (passageError) return apiError(500, "database_error", "Could not load the passage.");
  if (!passage) return apiError(404, "passage_not_found", "Passage not found or not active.");

  const passageLanguage = passage.language as SupportedLanguage;
  if (language !== passageLanguage) {
    return apiError(400, "language_mismatch", "The selected language does not match this passage.");
  }

  const offlineTap = inputMode === "tap";
  // Demo Mode labels speech checks. An offline tap stays a teacher-marked check.
  const demoTranscript = !offlineTap && (isDemoMode() || useFixture === true);
  if (demoTranscript && !findReadingFixture(passageId, passageLanguage)) {
    return apiError(
      409,
      "fixture_unavailable",
      "Demo Mode is unavailable for this passage because it has no prepared transcript.",
    );
  }

  const { data: created, error: createError } = await supabase
    .from("assessments")
    .insert({
      learner_id: learnerId,
      passage_id: passageId,
      language: passageLanguage,
      status: "recording",
      demo_transcript: demoTranscript,
      input_mode: offlineTap ? "tap" : "speech",
    })
    .select("id")
    .single();
  if (createError || !created) {
    return apiError(500, "database_error", "Could not create the assessment.");
  }

  const response: CreateAssessmentResponse = {
    id: created.id as string,
    status: "recording",
    language: passageLanguage,
    demoTranscript,
  };
  return Response.json(response, { status: 201 });
}
