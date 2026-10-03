"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

export function InterventionPicker({
  assessmentId,
  suggested,
  chosen: initialChosen,
  learnerId,
}: InterventionPickerProps) {
  const router = useRouter();
  const [chosen, setChosen] = useState<InterventionId | null>(initialChosen);
  const [selected, setSelected] = useState<InterventionId | null>(initialChosen ?? suggested);
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
        setChosen((body as { interventionId: InterventionId }).interventionId);
        router.push(`/progress/${learnerId}`);
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
      <button
        type="submit"
        disabled={!selected || saving || selected === chosen}
        className="btn btn-primary w-full sm:w-auto sm:min-w-64"
      >
        {saving ? "Saving…" : "Save chosen activity"}
      </button>
    </form>
  );
}
