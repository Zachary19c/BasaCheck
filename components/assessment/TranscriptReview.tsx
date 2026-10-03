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
        <h2 id="review-heading" className="text-lg font-semibold">
          {offlineTap
            ? "Review marked words"
            : demoTranscript
              ? "Review sample transcript"
              : "Review recording transcript"}
        </h2>
        {offlineTap && (
          <p className="tag tag-dashed">
            Offline tap · teacher-marked words
          </p>
        )}
        {demoTranscript && (
          <p className="tag tag-dashed">
            Demo Mode · prepared transcript
          </p>
        )}
        <p className="text-sm text-ink-2">
          {offlineTap
            ? "This text comes from the words you marked. Change it if a tap does not match what the learner said."
            : demoTranscript
              ? "This is a prepared sample, not the learner’s recording. Results from this path are labeled Demo Mode."
              : "Replay the recording and compare it with the recognized text. Fix speech-recognition mistakes, but keep the learner’s real differences from the passage. If you cannot tell what was said, record again."}
        </p>
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
            className="mt-2 w-full rounded-full"
          >
            Your browser cannot play this recording.
          </audio>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">Expected passage</h3>
          <p className="mt-1 rounded-xl border border-line bg-sheet p-3">{expectedText}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">
            {offlineTap
              ? "Marked transcript"
              : demoTranscript
                ? "Sample transcript"
                : "Recognized transcript"}
          </h3>
          <p className="mt-1 rounded-xl border border-line bg-sheet p-3">{originalTranscript}</p>
        </div>
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
          className="field mt-1"
        />
      </div>

      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={confirm}
          disabled={busy || !draft.trim()}
          className="btn btn-primary"
        >
          {busy ? "Confirming…" : "Confirm transcript"}
        </button>
        <button
          type="button"
          onClick={onRecordAgain}
          disabled={busy}
          className="btn btn-secondary"
        >
          {offlineTap ? "Mark words again" : demoTranscript ? "Start a live recording" : "Record again"}
        </button>
      </div>
    </section>
  );
}
