import "server-only";
import { MAX_RECORDING_SECONDS } from "@/lib/assessment/contract";
import type { SupportedLanguage, TranscribeResponse } from "@/lib/types";

// Speech-to-text for recordings. By default this calls the local speech
// service (speech-service/main.py). SPEECH_PROVIDER=groq sends the audio to
// Groq's hosted Whisper instead, for hosts such as Vercel that cannot run the
// Python service. Either way the result is only a draft for the teacher.

const TIMEOUT_MS = 120_000;
const GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const DEFAULT_GROQ_STT_MODEL = "whisper-large-v3";

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
  return process.env.SPEECH_PROVIDER?.trim().toLowerCase() === "groq"
    ? transcribeWithGroq(audio, language)
    : transcribeLocally(audio, language);
}

async function transcribeLocally(audio: Blob, language: SupportedLanguage): Promise<TranscribeResponse> {
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
  return checkedResult(transcript, durationSeconds);
}

// Groq's OpenAI-compatible transcription endpoint. verbose_json includes the
// decoded duration, which Reading Rate needs.
async function transcribeWithGroq(audio: Blob, language: SupportedLanguage): Promise<TranscribeResponse> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new SpeechError("speech_unavailable");

  const form = new FormData();
  form.append("file", audio, audioFileName(audio));
  form.append("model", process.env.GROQ_STT_MODEL?.trim() || DEFAULT_GROQ_STT_MODEL);
  form.append("language", toWhisperLanguage(language));
  form.append("response_format", "verbose_json");
  form.append("temperature", "0");

  let response: Response;
  try {
    response = await fetch(GROQ_STT_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
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

  if (response.status === 413) throw new SpeechError("audio_too_large");
  if (response.status === 400) throw new SpeechError("invalid_audio");
  if (!response.ok) throw new SpeechError("speech_failed");

  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== "object") throw new SpeechError("speech_failed");
  const { text, duration } = body as Record<string, unknown>;
  const result = checkedResult(text, duration);
  if (result.durationSeconds > MAX_RECORDING_SECONDS + 5) throw new SpeechError("audio_too_long");
  return result;
}

function checkedResult(transcript: unknown, durationSeconds: unknown): TranscribeResponse {
  if (typeof transcript !== "string") throw new SpeechError("speech_failed");
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new SpeechError("invalid_duration");
  }
  const text = transcript.trim();
  if (!text) throw new SpeechError("empty_transcript");
  return { transcript: text, durationSeconds };
}

// Groq reads the audio format from the file extension.
function audioFileName(audio: Blob): string {
  if (audio instanceof File && /\.[a-z0-9]+$/i.test(audio.name)) return audio.name;
  if (audio.type.includes("mp4")) return "recording.mp4";
  if (audio.type.includes("ogg")) return "recording.ogg";
  if (audio.type.includes("wav")) return "recording.wav";
  return "recording.webm";
}

function serviceErrorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (!detail || typeof detail !== "object") return null;
  const code = (detail as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}
