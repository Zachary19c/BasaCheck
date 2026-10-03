import { apiError, isUuid, readJsonObject } from "@/lib/assessment/api";
import { type TapResponse, MAX_RECORDING_SECONDS, MAX_TRANSCRIPT_CHARS } from "@/lib/assessment/contract";
import { createClient } from "@/lib/supabase/server";

// Saves the teacher-marked transcript and moves the check to review.
// This route never scores reading. The confirm route does, after the teacher
// checks the text built from the taps.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return apiError(404, "assessment_not_found", "Assessment not found.");

  const body = await readJsonObject(request);
  if (!body || typeof body.transcript !== "string" || typeof body.durationSeconds !== "number") {
    return apiError(400, "invalid_request", "Send the marked transcript and how long the reading took.");
  }

  const transcript = body.transcript.trim();
  const durationSeconds = body.durationSeconds;
  if (!transcript) {
    return apiError(422, "empty_transcript", "Leave the words the learner read unmarked.");
  }
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return apiError(422, "transcript_too_long", "The marked transcript is too long for this passage.");
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > MAX_RECORDING_SECONDS) {
    return apiError(
      422,
      "invalid_duration",
      "Start the timer, let the learner read, then tap Done.",
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, status, input_mode")
    .eq("id", id)
    .maybeSingle();
  if (error) return apiError(500, "database_error", "Could not load the assessment.");
  if (!data) return apiError(404, "assessment_not_found", "Assessment not found.");

  const assessment = data as { id: string; status: string; input_mode: string };
  if (assessment.input_mode !== "tap") {
    return apiError(409, "invalid_status", "This assessment is a recording, not an offline tap.");
  }
  if (assessment.status !== "recording") {
    return apiError(409, "invalid_status", "These marked words were already saved. Start a new check to mark again.");
  }

  const { data: saved, error: saveError } = await supabase
    .from("assessments")
    .update({
      status: "review",
      transcript,
      duration_seconds: durationSeconds,
      demo_transcript: false,
      error_code: null,
    })
    .eq("id", id)
    .eq("status", "recording")
    .eq("input_mode", "tap")
    .select("id")
    .maybeSingle();
  if (saveError) return apiError(500, "database_error", "Could not save the marked words.");
  if (!saved) {
    return apiError(409, "invalid_status", "These marked words were already saved. Start a new check to mark again.");
  }

  const response: TapResponse = {
    id,
    status: "review",
    transcript,
    durationSeconds,
  };
  return Response.json(response);
}
