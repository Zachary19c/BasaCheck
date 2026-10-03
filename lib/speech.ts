import "server-only";
import type { SupportedLanguage, TranscribeResponse } from "@/lib/types";

// Client for the local speech service (speech-service/main.py).

const TIMEOUT_MS = 120_000;

export type SpeechErrorCode =
  | "speech_unavailable"
  | "speech_timeout"
  | "speech_failed"
  | "invalid_audio"
  | "invalid_duration"
  | "audio_too_large"
  | "audio_too_long"
  | "empty_transcript";

const SERVICE_CODES: ReadonlySet<string> = new Set<SpeechErrorCode>([
  "invalid_audio",
  "invalid_duration",
  "audio_too_large",
  "audio_too_long",
  "empty_transcript",
]);

const HTTP_STATUS: Record<SpeechErrorCode, number> = {
  speech_unavailable: 503,
  speech_timeout: 504,
  speech_failed: 502,
  invalid_audio: 422,
  invalid_duration: 422,
  audio_too_large: 413,
  audio_too_long: 422,
  empty_transcript: 422,
};

const MESSAGES: Record<SpeechErrorCode, string> = {
  speech_unavailable: "The speech service is not reachable. Check that it is running, then try again.",
  speech_timeout: "Transcription took too long. Try again.",
  speech_failed: "The speech service could not transcribe this recording. Try again.",
  invalid_audio: "The recording could not be read. Record again.",
  invalid_duration: "The recording has no usable length. Record again.",
  audio_too_large: "The recording is larger than 10 MB. Record a shorter reading.",
  audio_too_long: "The recording is longer than 3 minutes. Record a shorter reading.",
  empty_transcript: "No speech was recognized. Record again closer to the microphone.",
};

export class SpeechError extends Error {
  readonly code: SpeechErrorCode;
  readonly status: number;

  constructor(code: SpeechErrorCode) {
    super(MESSAGES[code]);
    this.name = "SpeechError";
    this.code = code;
    this.status = HTTP_STATUS[code];
  }
}

// faster-whisper uses "tl" for Tagalog/Filipino.
export function toWhisperLanguage(language: SupportedLanguage): "tl" | "en" {
  return language === "fil" ? "tl" : "en";
}

export async function transcribe(
  audio: Blob,
  language: SupportedLanguage,
): Promise<TranscribeResponse> {
  const baseUrl = process.env.SPEECH_SERVICE_URL;
  if (!baseUrl) throw new SpeechError("speech_unavailable");

  const form = new FormData();
  form.append("audio", audio, "recording");
  form.append("language", toWhisperLanguage(language));

  let response: Response;
  try {
    response = await fetch(new URL("/transcribe", baseUrl), {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new SpeechError("speech_timeout");
    }
    throw new SpeechError("speech_unavailable");
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const code = serviceErrorCode(body);
    throw new SpeechError(code && SERVICE_CODES.has(code) ? (code as SpeechErrorCode) : "speech_failed");
  }

  if (!body || typeof body !== "object") throw new SpeechError("speech_failed");
  const { transcript, durationSeconds } = body as Record<string, unknown>;
  if (typeof transcript !== "string") throw new SpeechError("speech_failed");
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new SpeechError("invalid_duration");
  }
  const text = transcript.trim();
  if (!text) throw new SpeechError("empty_transcript");

  return { transcript: text, durationSeconds };
}

function serviceErrorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (!detail || typeof detail !== "object") return null;
  const code = (detail as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}
