import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssessmentFlow } from "@/components/assessment/AssessmentFlow";
import type { PassageOption } from "@/components/assessment/PassagePicker";
import { isUuid } from "@/lib/assessment/api";
import { isDemoMode } from "@/lib/demo-mode";
import { findReadingFixture } from "@/lib/reading";
import { createClient } from "@/lib/supabase/server";
import type { SupportedLanguage } from "@/lib/types";

export const metadata: Metadata = {
  title: "Reading check · BasaCheck",
};

type PassageRow = {
  id: string;
  title: string;
  content: string;
  language: SupportedLanguage;
  grade_level: number;
  difficulty: string;
  word_count: number;
};

export default async function AssessPage({
  params,
}: {
  params: Promise<{ learnerId: string }>;
}) {
  const { learnerId } = await params;
  if (!isUuid(learnerId)) notFound();

  const supabase = createClient();
  const [learnerResult, passagesResult] = await Promise.all([
    supabase
      .from("learners")
      .select("id, display_name, grade_level")
      .eq("id", learnerId)
      .maybeSingle(),
    supabase
      .from("passages")
      .select("id, title, content, language, grade_level, difficulty, word_count")
      .eq("is_active", true)
      .order("title"),
  ]);
  if (learnerResult.error || passagesResult.error) {
    throw new Error("Could not load the learner and passages.");
  }
  if (!learnerResult.data) notFound();

  const learner = learnerResult.data as { display_name: string; grade_level: number };
  const passages: PassageOption[] = (passagesResult.data as PassageRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    language: row.language,
    gradeLevel: row.grade_level,
    difficulty: row.difficulty,
    wordCount: row.word_count,
  }));
  const fixturePassageIds = passages
    .filter((passage) => findReadingFixture(passage.id, passage.language))
    .map((passage) => passage.id);

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-6">
      <header className="space-y-1">
        <Link href="/dashboard" className="text-sm font-medium text-blue-800 underline">
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold">Reading check</h1>
        <p className="text-neutral-700">
          {learner.display_name} · Grade {learner.grade_level}
        </p>
      </header>
      <AssessmentFlow
        learnerId={learnerId}
        passages={passages}
        demoMode={isDemoMode()}
        fixturePassageIds={fixturePassageIds}
      />
    </main>
  );
}
