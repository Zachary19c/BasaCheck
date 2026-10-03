import Link from "next/link";
import { ANA_LEARNER_ID } from "@/lib/content";
import {
  mapAssessmentFromDatabase,
  type AssessmentDatabaseRow,
} from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LatestAssessmentRecord = AssessmentDatabaseRow & {
  passages: { title: string } | { title: string }[] | null;
};

function displayScore(value: number | null, unit: "%" | " WPM") {
  return value === null ? "—" : `${Math.round(value)}${unit}`;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const [learnerResult, assessmentResult] = await Promise.all([
    supabase
      .from("learners")
      .select("id, display_name, grade_level")
      .eq("id", ANA_LEARNER_ID)
      .single(),
    supabase
      .from("assessments")
      .select(
        "id, learner_id, passage_id, language, status, transcript, verified_transcript, transcript_verified_at, demo_transcript, seeded_demo, input_mode, duration_seconds, accuracy_percent, wpm, comprehension_percent, answer_indexes, word_events, support_area, intervention_id, baseline_assessment_id, error_code, created_at, passages(title)",
      )
      .eq("learner_id", ANA_LEARNER_ID)
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (learnerResult.error) throw learnerResult.error;
  if (assessmentResult.error) throw assessmentResult.error;

  const learner = learnerResult.data;
  const latestRecord = assessmentResult.data as LatestAssessmentRecord | null;
  const latest = latestRecord
    ? mapAssessmentFromDatabase(latestRecord)
    : null;
  const passage = Array.isArray(latestRecord?.passages)
    ? latestRecord.passages[0]
    : latestRecord?.passages;
  const provenanceLabel = latest?.seededDemo
    ? "Seeded demo"
    : latest?.inputMode === "tap"
      ? "Offline tap"
      : latest?.demoTranscript
        ? "Demo Mode"
        : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6">
      <section>
        <p className="text-sm font-medium text-teal-700">Learner dashboard</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {learner.display_name}
        </h1>
        <p className="mt-1 text-neutral-600">Grade {learner.grade_level}</p>
      </section>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Latest completed check</h2>
            {latest ? (
              <p className="mt-1 text-sm text-neutral-600">
                {passage?.title ?? "Reading passage"} ·{" "}
                {new Intl.DateTimeFormat("en-PH", {
                  dateStyle: "medium",
                }).format(new Date(latest.createdAt))}
              </p>
            ) : null}
          </div>
          {provenanceLabel ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {provenanceLabel}
            </span>
          ) : null}
        </div>
        {latest ? (
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-neutral-50 p-3">
              <dt className="text-xs text-neutral-500">Accuracy</dt>
              <dd className="mt-1 font-bold">
                {displayScore(latest.accuracyPercent, "%")}
              </dd>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <dt className="text-xs text-neutral-500">Rate</dt>
              <dd className="mt-1 font-bold">
                {displayScore(latest.wpm, " WPM")}
              </dd>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <dt className="text-xs text-neutral-500">Comprehension</dt>
              <dd className="mt-1 font-bold">
                {displayScore(latest.comprehensionPercent, "%")}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            No completed checks yet.
          </p>
        )}
      </section>
      <div className="mt-auto grid gap-3 pt-3">
        <Link
          className="rounded-xl bg-teal-700 px-4 py-3 text-center font-semibold text-white hover:bg-teal-800"
          href={`/assess/${learner.id}`}
        >
          Start assessment
        </Link>
        <Link
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center font-semibold hover:bg-neutral-100"
          href={`/progress/${learner.id}`}
        >
          View progress
        </Link>
      </div>
    </main>
  );
}
