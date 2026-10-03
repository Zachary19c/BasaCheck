"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/assessment/contract";
import { INTERVENTION_IDS, INTERVENTIONS } from "@/lib/interventions";
import type { InterventionId, SupportedLanguage } from "@/lib/types";

// Owner: Member 4. Three static activity cards. The teacher can save any card;
// the suggestion is marked only when the demo rule produced one.

type InterventionPickerProps = {
  assessmentId: string;
  language: SupportedLanguage;
  suggested: InterventionId | null;
  chosen: InterventionId | null;
  learnerId: string;
};

export function InterventionPicker({
  assessmentId,
  language,
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
                    <span lang={language} className="font-semibold">
                      {card.title[language]}
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
                  <ol lang={language} className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
                    {card.steps[language].map((step) => (
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
        {chosen ? `Chosen activity: ${INTERVENTIONS[chosen].title[language]}` : "No activity saved yet."}
      </p>
      <button
        type="submit"
        disabled={!selected || saving || selected === chosen}
        className="min-h-12 w-full rounded-lg bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {saving ? "Saving…" : "Save chosen activity"}
      </button>
    </form>
  );
}
