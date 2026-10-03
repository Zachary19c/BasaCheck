"use client";

import { useId, useMemo, useState } from "react";
import {
  comprehension,
  findReadingFixture,
  ReadingInputError,
  scoreReading,
  supportArea,
} from "@/lib/reading";
import type { SupportedLanguage, WordEvent } from "@/lib/types";

// Owner: Member 3. Developer harness for lib/reading. Not an MVP screen.

export type DevPassage = {
  id: string;
  title: string;
  content: string;
  language: SupportedLanguage;
};

const LANGUAGE_LABEL: Record<SupportedLanguage, string> = {
  fil: "Filipino",
  en: "English",
};

const EVENT_STYLE: Record<WordEvent["type"], string> = {
  match: "bg-green-50 text-green-900 border-green-200",
  substitution: "bg-amber-50 text-amber-900 border-amber-300",
  omission: "bg-red-50 text-red-900 border-red-300",
  insertion: "bg-sky-50 text-sky-900 border-sky-300",
};

function describeEvent(event: WordEvent): string {
  switch (event.type) {
    case "match":
      return event.expected ?? "";
    case "substitution":
      return `${event.expected} → ${event.spoken}`;
    case "omission":
      return `${event.expected} (skipped)`;
    case "insertion":
      return `+ ${event.spoken}`;
  }
}

export function EngineTester({ passages }: { passages: DevPassage[] }) {
  const ids = {
    passage: useId(),
    transcript: useId(),
    duration: useId(),
    correct: useId(),
  };

  const [language, setLanguage] = useState<SupportedLanguage>("fil");
  const visible = passages.filter((p) => p.language === language);
  const [passageId, setPassageId] = useState(visible[0]?.id ?? "");
  const passage = passages.find((p) => p.id === passageId && p.language === language);

  const initialFixture = passage ? findReadingFixture(passage.id, passage.language) : null;
  const [transcript, setTranscript] = useState(initialFixture?.transcript ?? "");
  const [duration, setDuration] = useState(String(initialFixture?.durationSeconds ?? ""));
  const [correct, setCorrect] = useState(1);
  const [fixtureNote, setFixtureNote] = useState<string | null>(
    initialFixture ? "Loaded Demo Mode fixture." : null,
  );

  function loadFixture(target: DevPassage | undefined) {
    const fixture = target ? findReadingFixture(target.id, target.language) : null;
    if (!fixture) {
      setFixtureNote("Demo Mode unavailable for this passage: no matching fixture.");
      return;
    }
    setTranscript(fixture.transcript);
    setDuration(String(fixture.durationSeconds));
    setFixtureNote("Loaded Demo Mode fixture.");
  }

  function selectLanguage(next: SupportedLanguage) {
    setLanguage(next);
    const first = passages.find((p) => p.language === next);
    setPassageId(first?.id ?? "");
    loadFixture(first);
  }

  function selectPassage(id: string) {
    setPassageId(id);
    loadFixture(passages.find((p) => p.id === id));
  }

  const outcome = useMemo(() => {
    if (!passage) return { error: "Select a passage." } as const;
    try {
      const reading = scoreReading({
        expectedText: passage.content,
        transcript,
        durationSeconds: duration.trim() === "" ? Number.NaN : Number(duration),
      });
      const comprehensionPercent = comprehension(correct, 3);
      return {
        reading,
        comprehensionPercent,
        support: supportArea(reading.accuracyPercent, comprehensionPercent),
        matches: reading.events.filter((e) => e.type === "match").length,
        expectedCount: reading.events.filter((e) => e.type !== "insertion").length,
      } as const;
    } catch (error) {
      if (error instanceof ReadingInputError) {
        return { error: `${error.code}: ${error.message}` } as const;
      }
      throw error;
    }
  }, [passage, transcript, duration, correct]);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-1">
        <p className="w-fit rounded bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
          Developer test page · not part of the MVP
        </p>
        <h1 className="text-xl font-bold">Reading engine test</h1>
        <p className="text-sm text-neutral-600">
          Runs <code>lib/reading</code> in your browser. Passages are read from{" "}
          <code>supabase/seed.sql</code>. Nothing is saved.
        </p>
      </header>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Language</legend>
        <div className="flex gap-2">
          {(["fil", "en"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              aria-pressed={language === lang}
              onClick={() => selectLanguage(lang)}
              className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
                language === lang
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white"
              }`}
            >
              {LANGUAGE_LABEL[lang]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor={ids.passage} className="text-sm font-semibold">
          Passage
        </label>
        <select
          id={ids.passage}
          value={passageId}
          onChange={(e) => selectPassage(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        >
          {visible.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        {passage && (
          <p className="rounded bg-neutral-100 p-3 text-sm leading-relaxed">{passage.content}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor={ids.transcript} className="text-sm font-semibold">
            Verified spoken transcript
          </label>
          <button
            type="button"
            onClick={() => loadFixture(passage)}
            className="text-sm font-medium text-sky-700 underline"
          >
            Reload fixture
          </button>
        </div>
        <textarea
          id={ids.transcript}
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            setFixtureNote(null);
          }}
          rows={4}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        {fixtureNote && <p className="text-xs text-neutral-600">{fixtureNote}</p>}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={ids.duration} className="text-sm font-semibold">
            Duration (seconds)
          </label>
          <input
            id={ids.duration}
            type="number"
            inputMode="decimal"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={ids.correct} className="text-sm font-semibold">
            Correct answers
          </label>
          <select
            id={ids.correct}
            value={correct}
            onChange={(e) => setCorrect(Number(e.target.value))}
            className="rounded border border-neutral-300 px-3 py-2"
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n} of 3
              </option>
            ))}
          </select>
        </div>
      </div>

      <section aria-live="polite" className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Result</h2>

        {"error" in outcome ? (
          <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            Rejected, no reading score. <br />
            <code>{outcome.error}</code>
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="rounded border border-neutral-200 p-3">
                <dt className="font-semibold">Passage Reading Accuracy</dt>
                <dd className="text-2xl font-bold">
                  {outcome.reading.accuracyPercent.toFixed(2)}%
                </dd>
                <dd className="text-neutral-600">
                  {outcome.matches}/{outcome.expectedCount} matched · stored{" "}
                  {outcome.reading.accuracyPercent}
                </dd>
              </div>
              <div className="rounded border border-neutral-200 p-3">
                <dt className="font-semibold">Reading Rate</dt>
                <dd className="text-2xl font-bold">{Math.round(outcome.reading.wpm)} WPM</dd>
                <dd className="text-neutral-600">stored {outcome.reading.wpm}</dd>
              </div>
              <div className="rounded border border-neutral-200 p-3">
                <dt className="font-semibold">Comprehension</dt>
                <dd className="text-2xl font-bold">{Math.round(outcome.comprehensionPercent)}%</dd>
                <dd className="text-neutral-600">stored {outcome.comprehensionPercent}</dd>
              </div>
            </dl>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Word differences</h3>
              <ol className="flex flex-wrap gap-1.5">
                {outcome.reading.events.map((event, index) => (
                  <li
                    key={index}
                    className={`rounded border px-2 py-0.5 text-sm ${EVENT_STYLE[event.type]}`}
                  >
                    <span className="sr-only">{event.type}: </span>
                    {describeEvent(event)}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-neutral-600">
                Green match · amber substitution · red skipped · blue added
              </p>
            </div>

            <div className="rounded border border-neutral-300 p-3 text-sm">
              <p className="font-semibold">
                Support suggestion:{" "}
                {outcome.support ??
                  "No automatic suggestion. Teacher review recommended."}
              </p>
              <p className="text-xs text-neutral-600">
                Demo rules, not validated educational benchmarks. WPM is not an input.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
