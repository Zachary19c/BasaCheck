"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { ApiErrorBody } from "@/lib/assessment/contract";
import type { PassageQuestion } from "@/lib/questions";
import type { SupportedLanguage } from "@/lib/types";

// Owner: Member 4. Shows the three comprehension questions for the passage and
// submits only the chosen indexes. This component never knows the answer key.

const COPY: Record<
  SupportedLanguage,
  {
    intro: string;
    question: string;
    levels: [string, string, string];
    submit: string;
    submitting: string;
    missing: string;
  }
> = {
  fil: {
    intro: "Basahin ang bawat tanong sa mag-aaral at piliin ang kanyang sagot.",
    question: "Tanong",
    levels: ["Literal", "Pagpapakahulugan", "Paglalapat"],
    submit: "Isumite ang mga sagot",
    submitting: "Isinusumite…",
    missing: "Walang tanong para sa kuwentong ito.",
  },
  en: {
    intro: "Read each question to the learner and choose their answer.",
    question: "Question",
    levels: ["Locate", "Understand", "Evaluate and reflect"],
    submit: "Submit answers",
    submitting: "Submitting…",
    missing: "There are no questions for this passage.",
  },
};

type QuestionBlockProps = {
  assessmentId: string;
  language: SupportedLanguage;
  questions: PassageQuestion[];
};

export function QuestionBlock({ assessmentId, language, questions }: QuestionBlockProps) {
  const router = useRouter();
  const copy = COPY[language];
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = questions.length === 3 && answers.every((answer) => answer !== null);

  function choose(questionIndex: number, choiceIndex: number) {
    setAnswers((previous) =>
      previous.map((answer, index) => (index === questionIndex ? choiceIndex : answer)),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!complete || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerIndexes: answers }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as Partial<ApiErrorBody> | null;
        setError(body?.error?.message ?? `The answers could not be saved (${response.status}). Try again.`);
        setSubmitting(false);
        return;
      }
      router.push(`/results/${assessmentId}`);
    } catch {
      setError("Could not reach the BasaCheck server. Try again.");
      setSubmitting(false);
    }
  }

  if (questions.length !== 3) {
    return (
      <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950">
        {copy.missing}
      </p>
    );
  }

  return (
    <form onSubmit={submit} lang={language} className="space-y-4">
      <p className="text-sm text-neutral-700">{copy.intro}</p>
      {questions.map((question, questionIndex) => (
        <fieldset
          key={question.id}
          disabled={submitting}
          className="space-y-2 rounded-xl border border-neutral-300 p-4"
        >
          <legend className="px-1 font-semibold">
            <span className="block text-xs font-medium text-neutral-600">
              {copy.question} {questionIndex + 1}
              {copy.levels[questionIndex] ? ` · ${copy.levels[questionIndex]}` : ""}
            </span>
            {question.prompt}
          </legend>
          {question.choices.map((choice, choiceIndex) => (
            <label
              key={choiceIndex}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-neutral-300 px-3 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-700 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={choiceIndex}
                checked={answers[questionIndex] === choiceIndex}
                onChange={() => choose(questionIndex, choiceIndex)}
                className="size-4 accent-blue-700"
              />
              <span>{choice}</span>
            </label>
          ))}
        </fieldset>
      ))}

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!complete || submitting}
        className="min-h-12 w-full rounded-lg bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {submitting ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
