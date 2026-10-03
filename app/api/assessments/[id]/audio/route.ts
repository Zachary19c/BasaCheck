import type { SupabaseClient } from "@supabase/supabase-js";
import { apiError, isUuid } from "@/lib/assessment/api";
import { type AudioResponse, MAX_AUDIO_BYTES } from "@/lib/assessment/contract";
import { findReadingFixture } from "@/lib/reading";
import { SpeechError, transcribe } from "@/lib/speech";
import { createClient } from "@/lib/supabase/server";
import type { SupportedLanguage } from "@/lib/types";

// Multipart boundaries and the language field on top of the audio itself.
const FORM_OVERHEAD_BYTES = 64 * 1024;

type AssessmentForAudio = {
  id: string;
  passage_id: string;
  language: SupportedLanguage;
  status: string;
  demo_transcript: boolean;
};

// Turns a recording into the original transcript and moves the assessment to
// `review`. Demo assessments use the passage's prepared fixture and its own
// duration instead of the speech service. This route never scores reading:
// only the confirm route does, after the teacher verifies the transcript.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return apiError(404, "assessment_not_found", "Assessment not found.");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, passage_id, language, status, demo_transcript")
    .eq("id", id)
    .maybeSingle();
  if (error) return apiError(500, "database_error", "Could not load the assessment.");
  if (!data) return apiError(404, "assessment_not_found", "Assessment not found.");

  const assessment = data as AssessmentForAudio;
  if (assessment.status !== "recording") {
    return apiError(
      409,
      "invalid_status",
      "This assessment already has a recording. Start a new assessment to record again.",
    );
  }

  return assessment.demo_transcript
    ? loadFixtureTranscript(supabase, assessment)
    : transcribeRecording(request, supabase, assessment);
}

async function loadFixtureTranscript(supabase: SupabaseClient, assessment: AssessmentForAudio) {
  const fixture = findReadingFixture(assessment.passage_id, assessment.language);
  if (!fixture) {
    await supabase
      .from("assessments")
      .update({ status: "error", error_code: "fixture_unavailable" })
      .eq("id", assessment.id)
      .eq("status", "recording");
    return apiError(
      409,
      "fixture_unavailable",
      "Demo Mode is unavailable for this passage because it has no prepared transcript.",
    );
  }

  const { data: saved, error } = await supabase
    .from("assessments")
    .update({
      status: "review",
      transcript: fixture.transcript,
      duration_seconds: fixture.durationSeconds,
      error_code: null,
    })
    .eq("id", assessment.id)
    .eq("status", "recording")
    .select("id")
    .maybeSingle();
  if (error) return apiError(500, "database_error", "Could not save the transcript.");
  if (!saved) return apiError(409, "invalid_status", "This assessment already has a recording.");

  const response: AudioResponse = {
    id: assessment.id,
    status: "review",
    transcript: fixture.transcript,
    durationSeconds: fixture.durationSeconds,
    demoTranscript: true,
  };
  return Response.json(response);
}

async function transcribeRecording(
  request: Request,
  supabase: SupabaseClient,
  assessment: AssessmentForAudio,
) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > MAX_AUDIO_BYTES + FORM_OVERHEAD_BYTES) {
    return apiError(413, "audio_too_large", "The recording is larger than 10 MB. Record a shorter reading.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError(400, "invalid_request", "Send the recording as multipart form data.");
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return apiError(400, "invalid_audio", "The recording is empty. Record again.");
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return apiError(413, "audio_too_large", "The recording is larger than 10 MB. Record a shorter reading.");
  }
  const language = form.get("language");
  if (language !== null && language !== assessment.language) {
    return apiError(400, "language_mismatch", "The recording language does not match this assessment.");
  }

  // Claim the row so a second upload cannot run at the same time.
  const { data: claimed, error: claimError } = await supabase
    .from("assessments")
    .update({ status: "processing", error_code: null })
    .eq("id", assessment.id)
    .eq("status", "recording")
    .select("id")
    .maybeSingle();
  if (claimError) return apiError(500, "database_error", "Could not update the assessment.");
  if (!claimed) return apiError(409, "invalid_status", "This assessment already has a recording.");

  let result;
  try {
    result = await transcribe(audio, assessment.language);
  } catch (error) {
    const speechError = error instanceof SpeechError ? error : new SpeechError("speech_failed");
    // No transcript and no scores: the teacher retries or explicitly chooses Demo Mode.
    await supabase
      .from("assessments")
      .update({ status: "error", error_code: speechError.code })
      .eq("id", assessment.id)
      .eq("status", "processing");
    return apiError(speechError.status, speechError.code, speechError.message);
  }

  const { data: saved, error: saveError } = await supabase
    .from("assessments")
    .update({
      status: "review",
      transcript: result.transcript,
      duration_seconds: result.durationSeconds,
      error_code: null,
    })
    .eq("id", assessment.id)
    .eq("status", "processing")
    .select("id")
    .maybeSingle();
  if (saveError || !saved) {
    return apiError(500, "database_error", "Could not save the transcript.");
  }

  const response: AudioResponse = {
    id: assessment.id,
    status: "review",
    transcript: result.transcript,
    durationSeconds: result.durationSeconds,
    demoTranscript: false,
  };
  return Response.json(response);
}
