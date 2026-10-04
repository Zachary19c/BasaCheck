import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpeechError, toWhisperLanguage, transcribe } from "@/lib/speech";

vi.mock("server-only", () => ({}));

const audio = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });

function mockFetch(implementation: (url: URL, init: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(SpeechError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe("speech client", () => {
  beforeEach(() => vi.stubEnv("SPEECH_SERVICE_URL", "http://127.0.0.1:8000"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses Groq's hosted Whisper when SPEECH_PROVIDER=groq", async () => {
    vi.stubEnv("SPEECH_PROVIDER", "groq");
    vi.stubEnv("GROQ_API_KEY", "test-key");
    const fetchMock = mockFetch(async () => Response.json({ text: " Maya planted a seed. ", duration: 4.5 }));

    await expect(transcribe(audio, "fil")).resolves.toEqual({
      transcript: "Maya planted a seed.",
      durationSeconds: 4.5,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.groq.com/openai/v1/audio/transcriptions");
    const form = init.body as FormData;
    expect(form.get("language")).toBe("tl");
    expect(form.get("model")).toBe("whisper-large-v3");
    expect(form.get("response_format")).toBe("verbose_json");
    expect((form.get("file") as File).name).toBe("recording.webm");
  });

  it("reports Groq as unavailable without a key, and maps its errors", async () => {
    vi.stubEnv("SPEECH_PROVIDER", "groq");
    vi.stubEnv("GROQ_API_KEY", "");
    await expectCode(transcribe(audio, "en"), "speech_unavailable");

    vi.stubEnv("GROQ_API_KEY", "test-key");
    mockFetch(async () => new Response("bad file", { status: 400 }));
    await expectCode(transcribe(audio, "en"), "invalid_audio");
    mockFetch(async () => Response.json({ text: "   ", duration: 3 }));
    await expectCode(transcribe(audio, "en"), "empty_transcript");
  });

  it("maps app languages to faster-whisper codes", () => {
    expect(toWhisperLanguage("fil")).toBe("tl");
    expect(toWhisperLanguage("en")).toBe("en");
  });

  it("posts the audio and mapped language, and returns the trimmed transcript", async () => {
    const fetchMock = mockFetch(async () =>
      Response.json({ transcript: "  Maya planted a seed.  ", durationSeconds: 4.5 }),
    );

    await expect(transcribe(audio, "fil")).resolves.toEqual({
      transcript: "Maya planted a seed.",
      durationSeconds: 4.5,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://127.0.0.1:8000/transcribe");
    const form = init.body as FormData;
    expect(form.get("language")).toBe("tl");
    expect(form.get("audio")).toBeInstanceOf(Blob);
  });

  it("reports a missing service URL or an unreachable service as unavailable", async () => {
    vi.stubEnv("SPEECH_SERVICE_URL", "");
    await expectCode(transcribe(audio, "en"), "speech_unavailable");

    vi.stubEnv("SPEECH_SERVICE_URL", "http://127.0.0.1:8000");
    mockFetch(async () => {
      throw new TypeError("fetch failed");
    });
    await expectCode(transcribe(audio, "en"), "speech_unavailable");
  });

  it("reports a timeout", async () => {
    mockFetch(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    await expectCode(transcribe(audio, "en"), "speech_timeout");
  });

  it("passes through known service error codes and hides unknown ones", async () => {
    mockFetch(async () =>
      Response.json({ detail: { code: "empty_transcript", message: "x" } }, { status: 422 }),
    );
    await expectCode(transcribe(audio, "en"), "empty_transcript");

    mockFetch(async () => Response.json({ detail: [{ msg: "Field required" }] }, { status: 422 }));
    await expectCode(transcribe(audio, "en"), "speech_failed");

    mockFetch(async () => new Response("Internal Server Error", { status: 500 }));
    await expectCode(transcribe(audio, "en"), "speech_failed");
  });

  it("rejects an empty transcript or a non-positive duration from the service", async () => {
    mockFetch(async () => Response.json({ transcript: "   ", durationSeconds: 3 }));
    await expectCode(transcribe(audio, "en"), "empty_transcript");

    mockFetch(async () => Response.json({ transcript: "words", durationSeconds: 0 }));
    await expectCode(transcribe(audio, "en"), "invalid_duration");
  });
});
