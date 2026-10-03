"use client";

import { useRef, useState } from "react";
import type {
  ApiErrorBody,
  AudioResponse,
  ConfirmRequest,
  ConfirmResponse,
  CreateAssessmentRequest,
  CreateAssessmentResponse,
  TapResponse,
} from "@/lib/assessment/contract";
import type { PassageQuestion } from "@/lib/questions";
import type { SupportedLanguage } from "@/lib/types";
import { QuestionBlock } from "@/components/QuestionBlock";
import { type PassageOption, PassagePicker } from "./PassagePicker";
import { Recorder } from "./Recorder";
import { TapPassage } from "./TapPassage";
import { TranscriptReview } from "./TranscriptReview";

type ActiveAssessment = {
  id: string;
  language: SupportedLanguage;
  demoTranscript: boolean;
  offlineTap: boolean;
};

type Phase =
  | { name: "setup" }
  | { name: "recording" }
  | { name: "tapping" }
  | { name: "processing" }
  | { name: "review"; transcript: string; draft: string }
  | { name: "confirmed"; transcript: string; verifiedTranscript: string }
  | { name: "error"; message: string };

const STEPS = ["Choose", "Read aloud", "Check words", "Questions"] as const;

function stepIndex(phase: Phase): number {
  if (phase.name === "recording" || phase.name === "tapping" || phase.name === "processing") return 1;
  if (phase.name === "review") return 2;
  if (phase.name === "confirmed") return 3;
  return 0;
}

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
  // Key-free questions (no answer keys), keyed by passage id.
  questionsByPassage: Record<string, PassageQuestion[]>;
};

// Language + passage selection → record → transcribe → teacher confirms the
// transcript. Every recording attempt is a new assessment row.
export function AssessmentFlow({
  learnerId,
  passages,
  demoMode,
  fixturePassageIds,
  questionsByPassage,
}: AssessmentFlowProps) {
  const [language, setLanguage] = useState<SupportedLanguage>("fil");
  const [passageId, setPassageId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "setup" });
  const [startingDemo, setStartingDemo] = useState(false);
  const [savingTap, setSavingTap] = useState(false);
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
    setStartingDemo(false);
    setSavingTap(false);
    setPhase({ name: "setup" });
  }

  async function createAssessment(
    useFixture: boolean,
    inputMode?: "tap",
  ): Promise<ActiveAssessment | null> {
    if (!selected) return null;
    const payload: CreateAssessmentRequest = {
      learnerId,
      passageId: selected.id,
      language: selected.language,
      useFixture,
      inputMode,
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
      offlineTap: inputMode === "tap",
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

  async function startTapMode() {
    const created = await createAssessment(false, "tap");
    if (created) setPhase({ name: "tapping" });
  }

  async function finishTap(transcript: string, durationSeconds: number) {
    const current = activeRef.current;
    if (!current) return;
    setSavingTap(true);
    const result = await postJson<TapResponse>(`/api/assessments/${current.id}/tap`, {
      transcript,
      durationSeconds,
    });
    setSavingTap(false);
    if (activeRef.current !== current) return;
    if (!result.ok) {
      fail(result.message);
      return;
    }
    setPhase({ name: "review", transcript: result.data.transcript, draft: result.data.transcript });
  }

  async function startDemoAssessment() {
    if (startingDemo) return;
    setStartingDemo(true);
    const created = await createAssessment(true);
    if (created) await submitAudio(null);
    else setStartingDemo(false);
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

  const steps = (
    phase.name === "tapping"
      ? ["Choose", "Mark words", "Check words", "Questions"]
      : demoMode
        ? ["Choose", "Prepared reading", "Check words", "Questions"]
        : [...STEPS]
  ) as [string, string, string, string];
  const currentStep = stepIndex(phase);
  const showPicker = phase.name === "setup" || phase.name === "recording" || phase.name === "error";

  return (
    <div className="space-y-6">
      <ol aria-label="Assessment steps" className="grid grid-cols-4 gap-1">
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={index === currentStep ? "step" : undefined}
            className={`rounded-lg px-1 py-2 text-center text-xs font-semibold ${
              index === currentStep ? "bg-teal-700 text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

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
        {showPicker ? (
          <PassagePicker
            language={language}
            passageId={passageId}
            passages={passages}
            locked={locked}
            onLanguageChange={changeLanguage}
            onPassageChange={setPassageId}
          />
        ) : (
          selected && (
            <p className="rounded-lg bg-neutral-100 p-3 text-sm">
              {selected.language === "fil" ? "Filipino" : "English"} · {selected.title} ·{" "}
              {selected.wordCount} words. Language and passage stay locked for this check.
            </p>
          )
        )}
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
            {phase.name === "setup" && (
              <button
                type="button"
                onClick={startTapMode}
                className="min-h-12 w-full rounded-lg border border-teal-700 px-4 font-semibold text-teal-800 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                Mark words offline
              </button>
            )}
            {demoMode ? (
              <button
                type="button"
                onClick={startDemoAssessment}
                disabled={startingDemo || phase.name === "recording"}
                className="min-h-12 w-full rounded-lg bg-teal-700 px-4 font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {startingDemo ? "Loading the prepared transcript…" : "Continue with prepared transcript"}
              </button>
            ) : (
              <Recorder onStart={startRecording} onRecorded={submitAudio} onError={fail} />
            )}
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

      {phase.name === "tapping" && selected && (
        <TapPassage
          content={selected.content}
          language={selected.language}
          saving={savingTap}
          onDone={finishTap}
          onCancel={startOver}
        />
      )}

      {phase.name === "review" && selected && active && (
        <TranscriptReview
          key={`${active.id}:${phase.draft}`}
          expectedText={selected.content}
          originalTranscript={phase.transcript}
          initialDraft={phase.draft}
          demoTranscript={active.demoTranscript}
          offlineTap={active.offlineTap}
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
            {active.offlineTap && (
              <p className="inline-block rounded bg-teal-100 px-2 py-0.5 text-sm font-semibold text-teal-900">
                Offline tap · teacher-marked words
              </p>
            )}
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

          <section aria-labelledby="questions-heading" className="space-y-2">
            <h2 id="questions-heading" className="text-lg font-bold">
              Comprehension questions
            </h2>
            <QuestionBlock
              assessmentId={active.id}
              language={active.language}
              questions={selected ? (questionsByPassage[selected.id] ?? []) : []}
            />
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
            {demoMode ? "This check could not continue" : "This recording could not be used"}
          </h2>
          <p className="text-red-950">{phase.message}</p>
          <p className="text-sm text-red-950">No reading score was saved.</p>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={startOver}
              className="min-h-12 rounded-lg bg-teal-700 px-4 font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Try again
            </button>
            {canUseFixture && !demoMode && (
              <button
                type="button"
                onClick={startDemoAssessment}
                disabled={startingDemo}
                className="min-h-12 rounded-lg border border-amber-400 bg-amber-50 px-4 font-semibold text-amber-950 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Use Demo Mode (prepared transcript)
              </button>
            )}
          </div>
          {canUseFixture && !demoMode && (
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
