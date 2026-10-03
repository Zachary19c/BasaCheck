"use client";

import type { SupportedLanguage } from "@/lib/types";

export type PassageOption = {
  id: string;
  title: string;
  content: string;
  language: SupportedLanguage;
  gradeLevel: number;
  difficulty: string;
  wordCount: number;
};

const LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: "fil", label: "Filipino" },
  { value: "en", label: "English" },
];

type PassagePickerProps = {
  language: SupportedLanguage;
  passageId: string | null;
  passages: PassageOption[];
  locked: boolean;
  onLanguageChange: (language: SupportedLanguage) => void;
  onPassageChange: (passageId: string) => void;
};

export function PassagePicker({
  language,
  passageId,
  passages,
  locked,
  onLanguageChange,
  onPassageChange,
}: PassagePickerProps) {
  const options = passages.filter((passage) => passage.language === language);

  return (
    <div className="space-y-4">
      <fieldset disabled={locked}>
        <legend className="mb-2 text-sm font-medium text-ink-2">Language</legend>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((option) => (
            <label
              key={option.value}
              className="choice flex min-h-12 items-center justify-center px-3 font-medium has-[:checked]:text-teal-deep"
            >
              <input
                type="radio"
                name="language"
                value={option.value}
                checked={language === option.value}
                onChange={() => onLanguageChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={locked}>
        <legend className="mb-2 text-sm font-medium text-ink-2">Passage</legend>
        <p className="mb-2 text-sm text-ink-2">
          Original texts in the Phil-IRI form for this grade. These are not the national test.
        </p>
        {options.length === 0 ? (
          <p className="note-dashed">
            No active passages in this language.
          </p>
        ) : (
          <div className="space-y-2">
            {options.map((passage) => (
              <label
                key={passage.id}
                className="choice p-3.5"
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="passage"
                    value={passage.id}
                    checked={passageId === passage.id}
                    onChange={() => onPassageChange(passage.id)}
                    className="radio-mark mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold">{passage.title}</span>
                    <span className="meta mt-0.5 block">
                      Grade {passage.gradeLevel} {passage.difficulty} · Phil-IRI form ·{" "}
                      {passage.wordCount} words
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-muted">
                      {passage.content}
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {locked && (
        <p className="text-sm text-ink-2">
          Language and passage are locked for this assessment. To change them, start a new
          assessment.
        </p>
      )}
    </div>
  );
}
