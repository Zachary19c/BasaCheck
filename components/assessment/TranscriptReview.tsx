"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/assessment/contract";

type TranscriptReviewProps = {
  expectedText: string;
  originalTranscript: string;
  initialDraft: string;
  recordedAudio?: Blob | null;
  demoTranscript: boolean;
  offlineTap?: boolean;
  // Resolves to an error message, or null when the transcript was confirmed.
  onConfirm: (verifiedTranscript: string) => Promise<string | null>;
  onRecordAgain: () => void;
};

// Teacher verification gate: reading is scored only after Confirm transcript.
export function TranscriptReview({
  expectedText,
  originalTranscript,
  initialDraft,
  recordedAudio = null,
  demoTranscript,
  offlineTap = false,
  onConfirm,
  onRecordAgain,
}: TranscriptReviewProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const player = audioRef.current;
    if (!recordedAudio || !player) return;
    const url = URL.createObjectURL(recordedAudio);
    player.src = url;
    return () => {
      player.removeAttribute("src");
      player.load();
      URL.revokeObjectURL(url);
    };
  }, [recordedAudio]);

  async function confirm() {
    setBusy(true);
    setError(null);
    const message = await onConfirm(draft);
    setBusy(false);
    if (message) setError(message);
  }

  return (
    <section aria-labelledby="review-heading" className="space-y-4">
      <div className="space-y-1">
        <h2 id="review-heading" className="text-lg font-bold">
          {offlineTap
            ? "Review marked words"
            : demoTranscript
              ? "Review sample transcript"
              : "Review recording transcript"}
        </h2>
        {offlineTap && (
          <p className="inline-block rounded bg-teal-100 px-2 py-0.5 text-sm font-semibold text-teal-900">
            Offline tap · teacher-marked words
          </p>
        )}
        {demoTranscript && (
          <p className="inline-block rounded bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-900">
            Demo Mode · prepared transcript
          </p>
        )}
        <p className="text-sm text-neutral-700">
          {offlineTap
            ? "This text comes from the words you marked. Change it if a tap does not match what the learner said."
            : demoTranscript
              ? "This is a prepared sample, not the learner’s recording. Results from this path are labeled Demo Mode."
              : "Replay the recording and compare it with the recognized text. Fix speech-recognition mistakes, but keep the learner’s real differences from the passage. If you cannot tell what was said, record again."}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Expected passage</h3>
        <p className="mt-1 rounded-lg bg-neutral-100 p-3">{expectedText}</p>
      </div>

      {recordedAudio && !demoTranscript && !offlineTap && (
        <div>
          <h3 id="recording-replay-heading" className="text-sm font-semibold">
            Learner recording
          </h3>
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            aria-labelledby="recording-replay-heading"
            className="mt-1 w-full"
          >
            Your browser cannot play this recording.
          </audio>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold">
          {offlineTap
            ? "Marked transcript"
            : demoTranscript
              ? "Sample transcript"
              : "Recognized transcript"}
        </h3>
        <p className="mt-1 rounded-lg bg-neutral-100 p-3">{originalTranscript}</p>
      </div>

      <div>
        <label htmlFor="verified-transcript" className="text-sm font-semibold">
          What the learner said
        </label>
        <textarea
          id="verified-transcript"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={MAX_TRANSCRIPT_CHARS}
          rows={5}
          disabled={busy}
          className="mt-1 block w-full rounded-lg border border-neutral-400 p-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:bg-neutral-100"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}

      <div className="grid gap-2">
        <button
          type="button"
          onClick={confirm}
          disabled={busy || !draft.trim()}
          className="min-h-12 rounded-lg bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          {busy ? "Confirming…" : "Confirm transcript"}
        </button>
        <button
          type="button"
          onClick={onRecordAgain}
          disabled={busy}
          className="min-h-12 rounded-lg border border-neutral-400 px-4 font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {offlineTap ? "Mark words again" : demoTranscript ? "Start a live recording" : "Record again"}
        </button>
      </div>
    </section>
  );
}
