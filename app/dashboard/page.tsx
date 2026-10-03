import Link from "next/link";
import { TickGauge } from "@/components/ui/TickGauge";
import {
  mapAssessmentFromDatabase,
  type AssessmentDatabaseRow,
} from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LearnerRecord = {
  id: string;
  display_name: string;
  grade_level: number;
};

type LatestAssessmentRecord = AssessmentDatabaseRow & {
  passages: { title: string } | { title: string }[] | null;
};

function passageTitle(record: LatestAssessmentRecord | undefined) {
  if (!record) return null;
  const passage = Array.isArray(record.passages) ? record.passages[0] : record.passages;
  return passage?.title ?? "Reading passage";
}

export default async function DashboardPage() {
  const supabase = createClient();
  const [learnersResult, assessmentsResult] = await Promise.all([
    supabase
      .from("learners")
      .select("id, display_name, grade_level")
      .order("grade_level", { ascending: true })
      .order("display_name", { ascending: true }),
    supabase
      .from("assessments")
      .select(
        "id, learner_id, passage_id, language, status, transcript, verified_transcript, transcript_verified_at, demo_transcript, seeded_demo, input_mode, duration_seconds, accuracy_percent, wpm, comprehension_percent, answer_indexes, word_events, support_area, intervention_id, baseline_assessment_id, error_code, created_at, passages(title)",
      )
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  if (learnersResult.error) throw learnersResult.error;
  if (assessmentsResult.error) throw assessmentsResult.error;

  const learners = learnersResult.data as LearnerRecord[];
  const completed = (assessmentsResult.data ?? []) as LatestAssessmentRecord[];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-6 pt-6 pb-16 sm:max-w-6xl sm:px-10 md:gap-7 md:pt-10">
      <section className="pb-1">
        <h1 className="text-[2.125rem] font-bold leading-tight md:text-[2.75rem]">Choose a learner</h1>
        <p className="mt-2 text-ink-2">Each learner reads passages for their own grade.</p>
      </section>
      {/* One column on phones; side by side on wider screens. */}
      <div className="grid gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {learners.map((learner) => {
          const latestRecord = completed.find((row) => row.learner_id === learner.id);
          const latest = latestRecord ? mapAssessmentFromDatabase(latestRecord) : null;
          const provenanceLabel = latest?.seededDemo
            ? "Seeded demo"
            : latest?.inputMode === "tap"
              ? "Offline tap"
              : latest?.demoTranscript
                ? "Demo Mode"
                : null;

          return (
            <section key={learner.id} className="panel flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{learner.display_name}</h2>
                  <p className="meta mt-0.5">Grade {learner.grade_level}</p>
                </div>
                {provenanceLabel ? (
                  <span className="tag tag-dashed shrink-0">{provenanceLabel}</span>
                ) : null}
              </div>
              {latest ? (
                <>
                  <div className="mt-4">
                    <p className="text-xs text-muted">
                      Latest check ·{" "}
                      {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
                        new Date(latest.createdAt),
                      )}
                    </p>
                    <p className="mt-0.5 font-medium text-ink">{passageTitle(latestRecord)}</p>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col-reverse items-center gap-1.5">
                      <dt className="text-xs text-ink-2">Accuracy</dt>
                      <dd>
                        <TickGauge value={latest.accuracyPercent} size={78} ticks={40} />
                      </dd>
                    </div>
                    <div className="flex flex-col-reverse items-center gap-1.5">
                      <dt className="text-xs text-ink-2">Comprehension</dt>
                      <dd>
                        <TickGauge value={latest.comprehensionPercent} size={78} ticks={40} />
                      </dd>
                    </div>
                    <div className="flex flex-col-reverse items-center gap-1.5">
                      <dt className="text-xs text-ink-2">Reading rate</dt>
                      <dd className="flex h-[78px] flex-col items-center justify-center">
                        <span className="font-mono text-xl font-semibold tabular-nums">
                          {latest.wpm === null ? "—" : Math.round(latest.wpm)}
                        </span>
                        <span className="meta text-[0.6875rem]">words/min</span>
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="mt-4 text-sm text-ink-2">No completed checks yet.</p>
              )}
              <div className="mt-auto grid gap-2 pt-5">
                <Link className="btn btn-primary" href={`/assess/${learner.id}`}>
                  Start assessment
                </Link>
                <Link className="btn btn-secondary" href={`/progress/${learner.id}`}>
                  View progress
                </Link>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
