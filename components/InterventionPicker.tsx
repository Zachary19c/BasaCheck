"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import type { ApiErrorBody } from "@/lib/assessment/contract";
import { INTERVENTION_IDS, INTERVENTIONS } from "@/lib/interventions";
import type { InterventionId, SupportedLanguage } from "@/lib/types";

// Owner: Member 4. Three static activity cards. The teacher can save any card;
// the suggestion is marked only when the demo rule produced one.
// Cards are teacher-facing, so they always show in English, whatever the
// passage language.

type InterventionPickerProps = {
  assessmentId: string;
  // Passage language. Kept for callers; the cards no longer use it.
  language: SupportedLanguage;
  suggested: InterventionId | null;
  chosen: InterventionId | null;
  learnerId: string;
};

const PRACTICE_GOALS: Record<InterventionId, { focus: string; lookFor: string }> = {
  "main-idea": {
    focus: "Understanding the main idea",
    lookFor: "Can the learner say what the paragraph is mostly about and explain why?",
  },
  "word-practice": {
    focus: "Reading words accurately",
    lookFor: "Can the learner read the practiced words in a phrase and in the passage?",
  },
  "repeated-reading": {
    focus: "Reading more smoothly",
    lookFor: "Can the learner reread with fewer pauses and talk about what it means?",
  },
};

export function InterventionPicker({
  assessmentId,
  suggested,
  chosen: initialChosen,
  learnerId,
}: InterventionPickerProps) {
  const [chosen, setChosen] = useState<InterventionId | null>(initialChosen);
  const [selected, setSelected] = useState<InterventionId | null>(initialChosen ?? suggested);
  const [showChooser, setShowChooser] = useState(initialChosen === null);
  const [stepIndex, setStepIndex] = useState(0);
  const [guideFinished, setGuideFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/intervention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interventionId: selected }),
        signal: controller.signal,
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          (body as Partial<ApiErrorBody> | null)?.error?.message ??
            `The activity could not be saved (${response.status}). Try again.`,
        );
      } else {
        const savedId = (body as { interventionId: InterventionId }).interventionId;
        setChosen(savedId);
        setSelected(savedId);
        setShowChooser(false);
        setStepIndex(0);
        setGuideFinished(false);
      }
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name === "AbortError"
          ? "Saving took too long. Check your connection and try again."
          : "Could not reach the BasaCheck server. Try again.",
      );
    } finally {
      window.clearTimeout(timeout);
      setSaving(false);
    }
  }

  if (chosen && !showChooser) {
    const card = INTERVENTIONS[chosen];
    const goal = PRACTICE_GOALS[chosen];
    return (
      <section aria-labelledby="saved-activity-heading" className="space-y-3 rounded-xl border border-teal-300 bg-teal-50 p-4">
        <p role="status" className="text-sm font-semibold text-teal-900">Activity saved</p>
        <h3 id="saved-activity-heading" className="text-lg font-bold text-teal-950">
          {card.title.en}
        </h3>
        <p className="text-sm font-semibold text-teal-950">Focus: {goal.focus}</p>
        {guideFinished ? (
          <div className="space-y-3" aria-live="polite">
            <p className="font-semibold text-teal-950">You reached the end of the practice guide.</p>
            <p className="text-sm text-teal-950">Look for: {goal.lookFor}</p>
            <p className="text-sm text-teal-950">
              The practice guide does not change reading scores. Another reading check gives new
              scores; progress compares checks only when they are linked.
            </p>
            <Link
              href={`/assess/${learnerId}`}
              className="block min-h-12 rounded-lg bg-teal-700 px-4 py-3 text-center font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Start another reading check
            </Link>
            <button
              type="button"
              onClick={() => {
                setStepIndex(0);
                setGuideFinished(false);
              }}
              className="min-h-12 w-full rounded-lg border border-teal-700 px-4 font-semibold text-teal-900 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Review practice steps
            </button>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-teal-200 bg-white p-3" aria-live="polite">
            <p className="text-sm font-semibold text-teal-900">
              Step {stepIndex + 1} of {card.steps.en.length}
            </p>
            <p lang="en" className="text-lg font-medium text-teal-950">{card.steps.en[stepIndex]}</p>
            <p className="text-sm text-teal-900">Do this with the learner, then continue.</p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => {
                  if (stepIndex === card.steps.en.length - 1) setGuideFinished(true);
                  else setStepIndex(stepIndex + 1);
                }}
                className="min-h-12 rounded-lg bg-teal-700 px-4 font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                {stepIndex === card.steps.en.length - 1 ? "Finish practice guide" : "Next step"}
              </button>
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStepIndex(stepIndex - 1)}
                  className="min-h-12 rounded-lg border border-teal-700 px-4 font-semibold text-teal-900 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  Previous step
                </button>
              )}
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => setShowChooser(true)}
            className="min-h-12 rounded-lg border border-teal-700 px-4 font-semibold text-teal-900 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Choose a different activity
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <fieldset disabled={saving} className="space-y-3">
        <legend className="mb-1 text-sm font-semibold">Choose an activity</legend>
        {INTERVENTION_IDS.map((id) => {
          const card = INTERVENTIONS[id];
          return (
            <label
              key={id}
              className="block cursor-pointer rounded-xl border border-neutral-300 p-4 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-700"
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="intervention"
                  value={id}
                  checked={selected === id}
                  onChange={() => setSelected(id)}
                  className="mt-1 size-4 accent-blue-700"
                />
                <span className="min-w-0 space-y-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <span lang="en" className="font-semibold">
                      {card.title.en}
                    </span>
                    {suggested === id && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                        Suggested activity
                      </span>
                    )}
                    {chosen === id && (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-900">
                        Chosen activity
                      </span>
                    )}
                  </span>
                  <ol lang="en" className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
                    {card.steps.en.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950">
          {error}
        </p>
      )}
      <p role="status" aria-live="polite" className="text-sm text-neutral-700">
        {chosen ? `Chosen activity: ${INTERVENTIONS[chosen].title.en}` : "No activity saved yet."}
      </p>
      <button
        type="submit"
        disabled={!selected || saving || selected === chosen}
        className="min-h-12 w-full rounded-lg bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {saving ? "Saving…" : "Save chosen activity"}
      </button>
      {chosen && (
        <button
          type="button"
          onClick={() => {
            setSelected(chosen);
            setShowChooser(false);
          }}
          className="min-h-12 w-full rounded-lg border border-neutral-400 px-4 font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Keep saved activity
        </button>
      )}
    </form>
  );
}
