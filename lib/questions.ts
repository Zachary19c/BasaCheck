import "server-only";
import { createClient } from "@/lib/supabase/server";

// Owner: Member 4. Comprehension questions for one passage.
//
// getQuestionsForPassage reads the passage_questions view, which has no
// correct_index column, so its result is safe to pass to the browser.
// getAnswerKeyForPassage is the only reader of correct_index and is used only
// by POST /api/assessments/[id]/answers. Never send its result to the client.

export const QUESTIONS_PER_PASSAGE = 3;
export const CHOICES_PER_QUESTION = 3;

// Browser-safe question: no answer key field.
export type PassageQuestion = {
  id: string;
  prompt: string;
  choices: string[];
};

type Client = ReturnType<typeof createClient>;

type QuestionViewRow = {
  id: string;
  position: number;
  prompt: string;
  choices: unknown;
};

function toChoices(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((choice): choice is string => typeof choice === "string") : [];
}

export async function getQuestionsForPassage(
  passageId: string,
  supabase: Client = createClient(),
): Promise<PassageQuestion[]> {
  const { data, error } = await supabase
    .from("passage_questions")
    .select("id, position, prompt, choices")
    .eq("passage_id", passageId)
    .order("position");
  if (error) throw new Error("Could not load the questions.");

  return ((data ?? []) as QuestionViewRow[])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((row) => ({ id: row.id, prompt: row.prompt, choices: toChoices(row.choices) }));
}

// Server-only answer key, ordered by question position. Null when the passage
// does not have exactly three well-formed questions.
export async function getAnswerKeyForPassage(
  passageId: string,
  supabase: Client = createClient(),
): Promise<number[] | null> {
  const { data, error } = await supabase
    .from("questions")
    .select("position, correct_index")
    .eq("passage_id", passageId)
    .order("position");
  if (error) throw new Error("Could not load the answer key.");

  const rows = ((data ?? []) as { position: number; correct_index: number }[])
    .slice()
    .sort((a, b) => a.position - b.position);
  if (rows.length !== QUESTIONS_PER_PASSAGE) return null;
  const key = rows.map((row) => Number(row.correct_index));
  if (!key.every((index) => Number.isInteger(index) && index >= 0 && index < CHOICES_PER_QUESTION)) {
    return null;
  }
  return key;
}
