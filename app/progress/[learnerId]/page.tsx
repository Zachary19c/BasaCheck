import Link from "next/link";
import { notFound } from "next/navigation";
import {
  type AssessmentDatabaseRow,
  mapAssessmentFromDatabase,
} from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";
import { ProgressView } from "../ProgressView";
import { ArrowLeftIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function ProgressPage({
  params,
}: PageProps<"/progress/[learnerId]">) {
  const { learnerId } = await params;
  const { data: learner, error } = await createClient()
    .from("learners")
    .select("id, display_name, grade_level")
    .eq("id", learnerId)
    .maybeSingle();

  if (error) throw error;
  if (!learner) notFound();

  // Member 4: completed checks and passage titles for the comparison.
  const [assessmentResult, passageResult] = await Promise.all([
    createClient()
      .from("assessments")
      .select(
        "id, learner_id, passage_id, language, status, transcript, verified_transcript, transcript_verified_at, demo_transcript, seeded_demo, input_mode, duration_seconds, accuracy_percent, wpm, comprehension_percent, answer_indexes, word_events, support_area, intervention_id, baseline_assessment_id, error_code, created_at",
      )
      .eq("learner_id", learnerId)
      .eq("status", "complete")
      .order("created_at", { ascending: false }),
    createClient().from("passages").select("id, title"),
  ]);
  if (assessmentResult.error) throw assessmentResult.error;
  if (passageResult.error) throw passageResult.error;
  const assessments = (assessmentResult.data as AssessmentDatabaseRow[]).map(
    mapAssessmentFromDatabase,
  );
  const passageTitles = Object.fromEntries(
    (passageResult.data as { id: string; title: string }[]).map((p) => [p.id, p.title]),
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-6 pb-16 sm:max-w-6xl sm:px-10">
      <Link className="link-quiet self-start" href="/dashboard">
        <ArrowLeftIcon size={16} />
        Back to dashboard
      </Link>
      <section>
        <h1 className="text-[2.125rem] font-bold leading-tight">{learner.display_name}</h1>
        <p className="meta mt-2 text-sm">Learner progress · Grade {learner.grade_level}</p>
      </section>
      <div data-progress-slot>
        <ProgressView assessments={assessments} passageTitles={passageTitles} />
      </div>
      <p className="meta text-xs leading-5">
        Seeded demo data is illustrative, not evidence of a real intervention.
      </p>
    </main>
  );
}
