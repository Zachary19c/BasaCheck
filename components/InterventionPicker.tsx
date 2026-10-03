"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import type { ApiErrorBody } from "@/lib/assessment/contract";
import { ActivityMaterial } from "@/components/ActivityMaterial";
import { INTERVENTION_IDS, INTERVENTIONS } from "@/lib/interventions";
import type { InterventionId, SupportedLanguage, WordEvent } from "@/lib/types";

// Owner: Member 4. Three static activity cards. The teacher can save any card;
// the suggestion is marked only when the demo rule produced one.
// Cards are teacher-facing, so they always show in English, whatever the
// passage language.

type InterventionPickerProps = {
  assessmentId: string;
  // Passage language, for the learner material in the practice guide.
  language: SupportedLanguage;
  // The checked passage and its word differences, used to build the material
  // shown to the learner at each step. Without them the guide shows steps only.
  passage?: string;
  differences?: WordEvent[];
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
  language,
  passage,
  differences = [],
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
    const total = card.steps.en.length;
    return (
      <section
        aria-labelledby="saved-activity-heading"
        className="panel grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-8"
      >
        <div className="space-y-3">
          <p role="status" className="tag tag-teal">
            Activity saved
          </p>
          <h3 id="saved-activity-heading" className="text-xl font-semibold">
            {card.title.en}
          </h3>
          <p className="text-sm text-ink-2">
            <span className="font-semibold text-ink">Focus:</span> {goal.focus}
          </p>
          <button
            type="button"
            onClick={() => setShowChooser(true)}
            className="btn btn-secondary w-full md:w-auto"
          >
            Choose a different activity
          </button>
        </div>

        {guideFinished ? (
          <div className="space-y-3 rounded-xl border border-line bg-paper/60 p-4" aria-live="polite">
            <p className="font-semibold">You reached the end of the practice guide.</p>
            <p className="text-sm text-ink-2">
              <span className="font-semibold text-ink">Look for:</span> {goal.lookFor}
            </p>
            <p className="text-sm text-ink-2">
              The practice guide does not change reading scores. Another reading check gives new
              scores; progress compares checks only when they are linked.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href={`/assess/${learnerId}`} className="btn btn-primary">
                Start another reading check
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStepIndex(0);
                  setGuideFinished(false);
                }}
                className="btn btn-secondary"
              >
                Review practice steps
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 rounded-xl border border-line bg-paper/60 p-4" aria-live="polite">
            <div className="space-y-2">
              <span className="flex gap-1" aria-hidden="true">
                {card.steps.en.map((step, index) => (
                  <span
                    key={step}
                    className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-teal" : "bg-tick"}`}
                  />
                ))}
              </span>
              <p className="meta text-xs font-medium">
                Step {stepIndex + 1} of {total}
              </p>
            </div>
            <p lang="en" className="text-lg font-medium text-ink">
              {card.steps.en[stepIndex]}
            </p>
            <p className="text-sm text-ink-2">Do this with the learner, then continue.</p>
            {passage && (
              <ActivityMaterial
                activity={chosen}
                step={stepIndex}
                passage={passage}
                language={language}
                differences={differences}
              />
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStepIndex(stepIndex - 1)}
                  className="btn btn-secondary sm:flex-1"
                >
                  Previous step
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (stepIndex === total - 1) setGuideFinished(true);
                  else setStepIndex(stepIndex + 1);
                }}
                className="btn btn-primary sm:flex-1"
              >
                {stepIndex === total - 1 ? "Finish practice guide" : "Next step"}
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <fieldset disabled={saving} className="space-y-3">
        <legend className="mb-1 text-sm font-medium text-ink-2">Choose an activity</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {INTERVENTION_IDS.map((id) => {
            const card = INTERVENTIONS[id];
            return (
              <label key={id} className="choice h-full p-4">
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="intervention"
                    value={id}
                    checked={selected === id}
                    onChange={() => setSelected(id)}
                    className="radio-mark mt-0.5"
                  />
                  <span className="min-w-0 space-y-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <span lang="en" className="font-semibold">
                        {card.title.en}
                      </span>
                      {suggested === id && <span className="tag tag-sun">Suggested activity</span>}
                      {chosen === id && <span className="tag tag-teal">Chosen activity</span>}
                    </span>
                    <ol lang="en" className="list-decimal space-y-1 pl-5 text-sm text-ink-2 marker:font-mono marker:text-muted">
                      {card.steps.en.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
      <p role="status" aria-live="polite" className="text-sm text-ink-2">
        {chosen ? `Chosen activity: ${INTERVENTIONS[chosen].title.en}` : "No activity saved yet."}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={!selected || saving || selected === chosen}
          className="btn btn-primary w-full sm:w-auto sm:min-w-64"
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
            className="btn btn-secondary w-full sm:w-auto"
          >
            Keep saved activity
          </button>
        )}
      </div>
    </form>
  );
}
