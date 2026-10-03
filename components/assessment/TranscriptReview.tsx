"use client";

import { useState } from "react";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/assessment/contract";

type TranscriptReviewProps = {
  expectedText: string;
  originalTranscript: string;
  initialDraft: string;
  demoTranscript: boolean;
  // Resolves to an error message, or null when the transcript was confirmed.
  onConfirm: (verifiedTranscript: string) => Promise<string | null>;
  onRecordAgain: () => void;
};

// Teacher verification gate: reading is scored only after Confirm transcript.
export function TranscriptReview({
  expectedText,
  originalTranscript,
  initialDraft,
  demoTranscript,
  onConfirm,
  onRecordAgain,
}: TranscriptReviewProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          Check the transcript
        </h2>
        {demoTranscript && (
          <p className="inline-block rounded bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-900">
            Demo Mode · prepared transcript
          </p>
        )}
        <p className="text-sm text-neutral-700">
          Make the spoken transcript match what the learner actually said. Fix speech-recognition
          mistakes only, and keep the learner&apos;s real differences from the passage. If you
          cannot tell what was said, record again.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Expected passage</h3>
        <p className="mt-1 rounded-lg bg-neutral-100 p-3">{expectedText}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold">
          {demoTranscript ? "Prepared transcript" : "Original transcript (speech recognition)"}
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
          Record again
        </button>
      </div>
    </section>
  );
}
