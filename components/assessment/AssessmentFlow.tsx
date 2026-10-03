"use client";

import { useRef, useState } from "react";
import type {
  ApiErrorBody,
  AudioResponse,
  ConfirmRequest,
  ConfirmResponse,
  CreateAssessmentRequest,
  CreateAssessmentResponse,
} from "@/lib/assessment/contract";
import type { SupportedLanguage } from "@/lib/types";
import { type PassageOption, PassagePicker } from "./PassagePicker";
import { Recorder } from "./Recorder";
import { TranscriptReview } from "./TranscriptReview";

type ActiveAssessment = {
  id: string;
  language: SupportedLanguage;
  demoTranscript: boolean;
};

type Phase =
  | { name: "setup" }
  | { name: "recording" }
  | { name: "processing" }
  | { name: "review"; transcript: string; draft: string }
  | { name: "confirmed"; transcript: string; verifiedTranscript: string }
  | { name: "error"; message: string };

// Learner-facing instruction, shown in the passage language.
const INSTRUCTIONS: Record<SupportedLanguage, string> = {
  fil: "Basahin nang malakas ang kuwento.",
  en: "Read the story out loud.",
};

type AssessmentFlowProps = {
  learnerId: string;
  passages: PassageOption[];
  demoMode: boolean;
  fixturePassageIds: string[];
};

// Language + passage selection → record → transcribe → teacher confirms the
// transcript. Every recording attempt is a new assessment row.
export function AssessmentFlow({
  learnerId,
  passages,
  demoMode,
  fixturePassageIds,
}: AssessmentFlowProps) {
  const [language, setLanguage] = useState<SupportedLanguage>("fil");
  const [passageId, setPassageId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "setup" });
  const [active, setActive] = useState<ActiveAssessment | null>(null);
  // Recorder callbacks finish after later renders, so they read the current assessment here.
  const activeRef = useRef<ActiveAssessment | null>(null);

  const selected =
    passages.find((passage) => passage.id === passageId && passage.language === language) ?? null;
  const locked = phase.name !== "setup" && phase.name !== "error";
  const canUseFixture = selected !== null && fixturePassageIds.includes(selected.id);

  function changeLanguage(next: SupportedLanguage) {
    setLanguage(next);
    setPassageId(null);
  }

  function fail(message: string) {
    setPhase({ name: "error", message });
  }

  function startOver() {
    activeRef.current = null;
    setActive(null);
    setPhase({ name: "setup" });
  }

  async function createAssessment(useFixture: boolean): Promise<ActiveAssessment | null> {
    if (!selected) return null;
    const payload: CreateAssessmentRequest = {
      learnerId,
      passageId: selected.id,
      language: selected.language,
      useFixture,
    };
    const result = await postJson<CreateAssessmentResponse>("/api/assessments", payload);
    if (!result.ok) {
      fail(result.message);
      return null;
    }
    const created: ActiveAssessment = {
      id: result.data.id,
      language: result.data.language,
      demoTranscript: result.data.demoTranscript,
    };
    activeRef.current = created;
    setActive(created);
    return created;
  }

  async function startRecording(): Promise<boolean> {
    const created = await createAssessment(false);
    if (!created) return false;
    setPhase({ name: "recording" });
    return true;
  }

  // Demo assessments never upload audio: the server uses the passage's fixture.
  async function submitAudio(audio: Blob | null) {
    const current = activeRef.current;
    if (!current) return;
    setPhase({ name: "processing" });

    const init: RequestInit = { method: "POST" };
    if (!current.demoTranscript) {
      if (!audio) {
        fail("There is no recording to send. Record again.");
        return;
      }
      const form = new FormData();
      form.append("audio", audio, audioFileName(audio.type));
      form.append("language", current.language);
      init.body = form;
    }

    const result = await request<AudioResponse>(`/api/assessments/${current.id}/audio`, init);
    if (activeRef.current !== current) return;
    if (!result.ok) {
      fail(result.message);
      return;
    }
    setPhase({ name: "review", transcript: result.data.transcript, draft: result.data.transcript });
  }

  async function startDemoAssessment() {
    const created = await createAssessment(true);
    if (created) await submitAudio(null);
  }

  async function confirmTranscript(verifiedTranscript: string): Promise<string | null> {
    const current = activeRef.current;
    if (!current) return "This assessment is no longer active. Start again.";
    const payload: ConfirmRequest = { verifiedTranscript };
    const result = await postJson<ConfirmResponse>(
      `/api/assessments/${current.id}/confirm`,
      payload,
    );
    if (!result.ok) return result.message;
    setPhase((previous) =>
      previous.name === "review"
        ? {
            name: "confirmed",
            transcript: previous.transcript,
            verifiedTranscript: result.data.verifiedTranscript,
          }
        : previous,
    );
    return null;
  }

  return (
    <div className="space-y-6">
      {demoMode && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <strong>Demo Mode is on.</strong> Each assessment uses a prepared transcript matched to
          its passage. Recordings are not sent for transcription.
        </p>
      )}

      <section aria-labelledby="setup-heading" className="space-y-3">
        <h2 id="setup-heading" className="text-lg font-bold">
          Choose the reading
        </h2>
        <PassagePicker
          language={language}
          passageId={passageId}
          passages={passages}
          locked={locked}
          onLanguageChange={changeLanguage}
          onPassageChange={setPassageId}
        />
      </section>

      {(phase.name === "setup" || phase.name === "recording") &&
        (selected ? (
          <section
            aria-labelledby="read-heading"
            className="space-y-4 rounded-xl border border-neutral-300 p-4"
          >
            <div>
              <h2 id="read-heading" className="text-lg font-bold">
                {selected.title}
              </h2>
              <p lang={selected.language} className="mt-1 text-sm font-semibold text-neutral-700">
                {INSTRUCTIONS[selected.language]}
              </p>
            </div>
            <p lang={selected.language} className="text-xl leading-relaxed">
              {selected.content}
            </p>
            <Recorder onStart={startRecording} onRecorded={submitAudio} onError={fail} />
          </section>
        ) : (
          <p className="text-sm text-neutral-700">Choose a passage to start recording.</p>
        ))}

      {phase.name === "processing" && (
        <p role="status" aria-live="polite" className="rounded-lg bg-neutral-100 p-4 font-medium">
          {active?.demoTranscript
            ? "Loading the prepared transcript…"
            : "Transcribing the recording…"}
        </p>
      )}

      {phase.name === "review" && selected && active && (
        <TranscriptReview
          key={`${active.id}:${phase.draft}`}
          expectedText={selected.content}
          originalTranscript={phase.transcript}
          initialDraft={phase.draft}
          demoTranscript={active.demoTranscript}
          onConfirm={confirmTranscript}
          onRecordAgain={startOver}
        />
      )}

      {phase.name === "confirmed" && active && (
        <>
          <section aria-labelledby="confirmed-heading" className="space-y-3">
            <h2 id="confirmed-heading" className="text-lg font-bold">
              Transcript confirmed
            </h2>
            {active.demoTranscript && (
              <p className="inline-block rounded bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-900">
                Demo Mode · prepared transcript
              </p>
            )}
            <p className="rounded-lg bg-neutral-100 p-3">{phase.verifiedTranscript}</p>
            <button
              type="button"
              onClick={() =>
                setPhase({
                  name: "review",
                  transcript: phase.transcript,
                  draft: phase.verifiedTranscript,
                })
              }
              className="min-h-12 w-full rounded-lg border border-neutral-400 px-4 font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Edit transcript
            </button>
          </section>

          {/* TODO(Member 4): mount QuestionBlock here, for example
              <QuestionBlock assessmentId={active.id} passageId={selected.id} language={active.language} /> */}
          <section aria-labelledby="questions-heading" className="space-y-2">
            <h2 id="questions-heading" className="text-lg font-bold">
              Comprehension questions
            </h2>
            <p className="text-sm text-neutral-600">Questions are not connected yet.</p>
          </section>
        </>
      )}

      {phase.name === "error" && (
        <section
          role="alert"
          aria-labelledby="error-heading"
          className="space-y-3 rounded-xl border border-red-300 bg-red-50 p-4"
        >
          <h2 id="error-heading" className="font-bold text-red-950">
            This recording could not be used
          </h2>
          <p className="text-red-950">{phase.message}</p>
          <p className="text-sm text-red-950">No reading score was saved.</p>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={startOver}
              className="min-h-12 rounded-lg bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Try again
            </button>
            {canUseFixture && (
              <button
                type="button"
                onClick={startDemoAssessment}
                className="min-h-12 rounded-lg border border-amber-400 bg-amber-50 px-4 font-semibold text-amber-950 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              >
                Use Demo Mode (prepared transcript)
              </button>
            )}
          </div>
          {canUseFixture && (
            <p className="text-sm text-red-950">
              Demo Mode uses a prepared transcript matched to this passage and is labeled on the
              results. You still check and confirm it before scoring.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

type Result<T> = { ok: true; data: T } | { ok: false; message: string };

async function request<T>(url: string, init: RequestInit): Promise<Result<T>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    return { ok: false, message: "Could not reach the BasaCheck server. Try again." };
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as Partial<ApiErrorBody> | null)?.error?.message;
    return { ok: false, message: message ?? `The request failed (${response.status}). Try again.` };
  }
  return { ok: true, data: body as T };
}

function postJson<T>(url: string, payload: unknown): Promise<Result<T>> {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function audioFileName(mimeType: string): string {
  if (mimeType.includes("mp4")) return "recording.mp4";
  if (mimeType.includes("ogg")) return "recording.ogg";
  return "recording.webm";
}
