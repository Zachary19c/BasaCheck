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
        <legend className="mb-2 text-sm font-semibold">Language</legend>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((option) => (
            <label
              key={option.value}
              className="flex min-h-12 cursor-pointer items-center justify-center rounded-lg border border-neutral-300 px-3 font-medium has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-900 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
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
        <legend className="mb-2 text-sm font-semibold">Passage</legend>
        {options.length === 0 ? (
          <p className="rounded-lg border border-neutral-300 p-3 text-sm text-neutral-700">
            No active passages in this language.
          </p>
        ) : (
          <div className="space-y-2">
            {options.map((passage) => (
              <label
                key={passage.id}
                className="block cursor-pointer rounded-lg border border-neutral-300 p-3 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="passage"
                    value={passage.id}
                    checked={passageId === passage.id}
                    onChange={() => onPassageChange(passage.id)}
                    className="mt-1 size-4 accent-blue-700"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold">{passage.title}</span>
                    <span className="block text-sm text-neutral-700">
                      Grade {passage.gradeLevel} · {passage.difficulty} (provisional) ·{" "}
                      {passage.wordCount} words
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-neutral-600">
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
        <p className="text-sm text-neutral-700">
          Language and passage are locked for this assessment. To change them, start a new
          assessment.
        </p>
      )}
    </div>
  );
}
