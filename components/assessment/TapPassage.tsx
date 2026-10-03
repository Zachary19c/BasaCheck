"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_RECORDING_SECONDS } from "@/lib/assessment/contract";
import { normalize } from "@/lib/reading";
import { transcriptFromTaps } from "@/lib/reading/taps";
import type { SupportedLanguage } from "@/lib/types";

const COPY: Record<
  SupportedLanguage,
  { help: string; start: string; done: string; missed: string; instead: string; cancel: string }
> = {
  fil: {
    help: "I-tap ang salitang hindi nakuha. Kung may ibang sinabi, ilagay ito sa kahon. Kung nilaktawan, iwanang blangko.",
    start: "Simulan ang pagbasa",
    done: "Tapos na ang pagbasa",
    missed: "Hindi nakuha",
    instead: "Ang sinabi",
    cancel: "Bumalik",
  },
  en: {
    help: "Tap each word the learner missed. If they said a different word, type it. If they skipped the word, leave the box blank.",
    start: "Start reading",
    done: "Done reading",
    missed: "missed",
    instead: "Said instead",
    cancel: "Back",
  },
};

type TapPassageProps = {
  content: string;
  language: SupportedLanguage;
  saving: boolean;
  onDone: (transcript: string, durationSeconds: number) => void;
  onCancel: () => void;
};

// Offline running record. The microphone and speech service are not used.
export function TapPassage({ content, language, saving, onDone, onCancel }: TapPassageProps) {
  const tokens = normalize(content);
  const copy = COPY[language];
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      if (startedAt.current === null) return;
      const seconds = (performance.now() - startedAt.current) / 1000;
      setElapsed(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) setRunning(false);
    }, 250);
    return () => window.clearInterval(timer);
  }, [running]);

  function toggle(index: number) {
    setMarks((previous) => {
      if (Object.prototype.hasOwnProperty.call(previous, index)) {
        const next = { ...previous };
        delete next[index];
        return next;
      }
      return { ...previous, [index]: "" };
    });
  }

  function start() {
    startedAt.current = performance.now();
    setElapsed(0);
    setError(null);
    setRunning(true);
  }

  function finish() {
    setRunning(false);
    const durationSeconds = Math.min(
      startedAt.current === null ? 0 : (performance.now() - startedAt.current) / 1000,
      MAX_RECORDING_SECONDS,
    );
    if (durationSeconds <= 0) {
      setError("Start the timer and let the learner read before you finish.");
      return;
    }
    const transcript = transcriptFromTaps(
      content,
      Object.entries(marks).map(([index, replacement]) => ({
        index: Number(index),
        spoken: replacement.trim() === "" ? null : replacement,
      })),
    );
    if (!transcript) {
      setError("Every word is marked as skipped. Leave the words the learner read unmarked.");
      return;
    }
    onDone(transcript, durationSeconds);
  }

  const missedCount = Object.keys(marks).length;

  return (
    <section aria-labelledby="tap-heading" className="space-y-4">
      <div className="space-y-1">
        <h2 id="tap-heading" className="text-lg font-bold">
          Offline tap
        </h2>
        <p className="inline-block rounded bg-teal-100 px-2 py-0.5 text-sm font-semibold text-teal-900">
          No microphone. The teacher marks the words.
        </p>
        <p lang={language} className="text-sm text-neutral-700">
          {copy.help}
        </p>
      </div>

      <p className="font-semibold" role="status" aria-live="polite">
        {running ? "Reading" : elapsed > 0 ? "Reading stopped" : "Not started"}{" "}
        {formatTime(Math.floor(elapsed))} · {missedCount} {copy.missed}
      </p>

      <div lang={language} className="flex flex-wrap gap-2">
        {tokens.map((token, index) => {
          const missed = Object.prototype.hasOwnProperty.call(marks, index);
          return (
            <div key={`${token}-${index}`} className="min-w-16">
              <button
                type="button"
                aria-pressed={missed}
                disabled={saving}
                onClick={() => toggle(index)}
                className={`min-h-12 w-full rounded-lg border px-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60 ${
                  missed
                    ? "border-amber-400 bg-amber-100 text-amber-950"
                    : "border-neutral-300 bg-white"
                }`}
              >
                {token}
              </button>
              {missed && (
                <input
                  value={marks[index]}
                  disabled={saving}
                  aria-label={`${copy.instead}: ${token}`}
                  placeholder={copy.instead}
                  onChange={(event) =>
                    setMarks((previous) => ({ ...previous, [index]: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-amber-400 px-2 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950">
          {error}
        </p>
      )}

      <div className="grid gap-2">
        {!running && elapsed === 0 ? (
          <button
            type="button"
            onClick={start}
            disabled={saving}
            className="min-h-12 rounded-lg bg-teal-700 px-4 font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {copy.start}
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="min-h-12 rounded-lg bg-teal-700 px-4 font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {saving ? "Saving…" : copy.done}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="min-h-12 rounded-lg border border-neutral-400 px-4 font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60"
        >
          {copy.cancel}
        </button>
      </div>
    </section>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
