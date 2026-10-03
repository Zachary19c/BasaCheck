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
      <p role="alert" className="alert">
        {copy.missing}
      </p>
    );
  }

  return (
    <form onSubmit={submit} lang={language} className="space-y-4">
      <p className="text-sm text-ink-2">{copy.intro}</p>
      <div className="grid gap-4 lg:grid-cols-3">
        {questions.map((question, questionIndex) => (
          <fieldset
            key={question.id}
            disabled={submitting}
            className="panel min-w-0 p-4"
          >
            <legend className="float-left mb-3 w-full font-semibold">
              <span className="meta mb-1 block text-xs">
                {copy.question} {questionIndex + 1}
                {copy.levels[questionIndex] ? ` · ${copy.levels[questionIndex]}` : ""}
              </span>
              {question.prompt}
            </legend>
            <div className="clear-both grid gap-2 md:grid-cols-3 lg:grid-cols-1">
              {question.choices.map((choice, choiceIndex) => (
                <label
                  key={choiceIndex}
                  className="choice flex min-h-12 items-center gap-3 px-3"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={choiceIndex}
                    checked={answers[questionIndex] === choiceIndex}
                    onChange={() => choose(questionIndex, choiceIndex)}
                    className="radio-mark"
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!complete || submitting}
        className="btn btn-primary w-full sm:w-auto sm:min-w-64"
      >
        {submitting ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
