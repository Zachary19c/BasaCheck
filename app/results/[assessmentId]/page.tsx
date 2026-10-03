import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiRecommendation } from "@/components/AiRecommendation";
import { InterventionPicker } from "@/components/InterventionPicker";
import { ProvenanceLabels } from "@/components/ProvenanceLabels";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { TickGauge } from "@/components/ui/TickGauge";
import { isUuid } from "@/lib/assessment/api";
import { formatNumber } from "@/lib/comparison";
import { suggestedIntervention } from "@/lib/interventions";
import { type AssessmentDatabaseRow, mapAssessmentFromDatabase } from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";
import type { WordEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Results · BasaCheck",
};

const ASSESSMENT_COLUMNS =
  "id, learner_id, passage_id, language, status, transcript, verified_transcript, transcript_verified_at, demo_transcript, seeded_demo, input_mode, duration_seconds, accuracy_percent, wpm, comprehension_percent, answer_indexes, word_events, support_area, intervention_id, baseline_assessment_id, error_code, created_at";

type DifferenceType = Exclude<WordEvent["type"], "match">;

const EVENT_LABELS: Record<WordEvent["type"], string> = {
  match: "Match",
  substitution: "Substitution",
  omission: "Omission",
  insertion: "Insertion",
};

// Swatch colors tell the three kinds apart; none of them means "wrong".
const EVENT_SWATCH: Record<DifferenceType, string> = {
  substitution: "bg-sun",
  omission: "bg-teal-deep",
  insertion: "bg-heron",
};

const DIFFERENCE_TYPES: DifferenceType[] = ["substitution", "omission", "insertion"];

function eventText(event: WordEvent): string {
  if (event.type === "substitution") return `${event.expected ?? ""} → ${event.spoken ?? ""}`;
  if (event.type === "insertion") return event.spoken ?? "";
  return event.expected ?? "";
}

function percent(value: number | null) {
  return value === null ? undefined : `${formatNumber(value)}%`;
}

// Comprehension is scored on three questions.
function questionsCorrect(value: number | null) {
  return value === null ? undefined : `${Math.round((value / 100) * 3)} of 3 correct`;
}

export default async function ResultsPage({ params }: PageProps<"/results/[assessmentId]">) {
  const { assessmentId } = await params;
  if (!isUuid(assessmentId)) notFound();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select(ASSESSMENT_COLUMNS)
    .eq("id", assessmentId)
    .maybeSingle();
  if (error) throw new Error("Could not load the assessment.");
  if (!data) notFound();
  const assessment = mapAssessmentFromDatabase(data as AssessmentDatabaseRow);

  const { data: passage } = await supabase
    .from("passages")
    .select("title")
    .eq("id", assessment.passageId)
    .maybeSingle();

  const complete = assessment.status === "complete";
  const suggested = suggestedIntervention(assessment.supportArea);
  const differences = assessment.wordEvents.filter((event) => event.type !== "match");
  const counts = DIFFERENCE_TYPES.map((type) => ({
    type,
    count: differences.filter((event) => event.type === type).length,
  }));

  return (
    <main className="mx-auto w-full max-w-md space-y-8 px-6 pt-6 pb-16 sm:max-w-6xl sm:px-10">
      <header className="space-y-3">
        <Link href="/dashboard" className="link-quiet">
          <ArrowLeftIcon size={16} />
          Back to dashboard
        </Link>
        <h1 className="text-[2.125rem] font-bold leading-tight">Results</h1>
        <p className="meta text-sm">
          {(passage as { title: string } | null)?.title ?? "Reading passage"} ·{" "}
          {assessment.language === "fil" ? "Filipino" : "English"}
        </p>
        <ProvenanceLabels assessment={assessment} />
      </header>

      {!complete && (
        <p role="status" className="note-dashed">
          This assessment is not complete yet. Measurements appear after the transcript is
          confirmed and the three questions are answered.
        </p>
      )}

      <div className="grid items-start gap-8 md:grid-cols-2">
        <section aria-labelledby="measurements-heading" className="panel space-y-5 p-5">
          <h2 id="measurements-heading" className="text-lg font-semibold">
            Measurements
          </h2>
          <dl className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col-reverse items-center gap-2 text-center">
                <dt className="text-sm font-medium text-ink-2">Passage Reading Accuracy</dt>
                <dd>
                  <TickGauge
                    size={120}
                    value={assessment.accuracyPercent}
                    display={percent(assessment.accuracyPercent)}
                  />
                  {assessment.accuracyPercent === null && <span className="sr-only">Not recorded</span>}
                </dd>
              </div>
              <div className="flex flex-col-reverse items-center gap-2 text-center">
                <dt className="text-sm font-medium text-ink-2">Comprehension</dt>
                <dd>
                  <TickGauge
                    size={120}
                    value={assessment.comprehensionPercent}
                    display={percent(assessment.comprehensionPercent)}
                    caption={questionsCorrect(assessment.comprehensionPercent)}
                  />
                  {assessment.comprehensionPercent === null && (
                    <span className="sr-only">Not recorded</span>
                  )}
                </dd>
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4">
              <dt className="text-sm font-medium text-ink-2">Reading Rate</dt>
              <dd className="text-sm font-semibold tabular-nums">
                {assessment.wpm === null ? "Not recorded" : `${formatNumber(assessment.wpm)} words per minute`}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="differences-heading" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="differences-heading" className="text-lg font-semibold">
              Word differences
            </h2>
            {differences.length > 0 && <span className="meta">{differences.length} total</span>}
          </div>
          {differences.length === 0 ? (
            <p className="text-sm text-ink-2">No word differences recorded.</p>
          ) : (
            <>
              <div className="flex h-2.5 gap-1" aria-hidden="true">
                {counts
                  .filter((item) => item.count > 0)
                  .map((item) => (
                    <span
                      key={item.type}
                      className={`rounded-full ${EVENT_SWATCH[item.type]}`}
                      style={{ flexGrow: item.count }}
                    />
                  ))}
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                {counts.map((item) => (
                  <li key={item.type} className="flex items-center gap-1.5">
                    <span className={`size-2.5 rounded-[3px] ${EVENT_SWATCH[item.type]}`} aria-hidden="true" />
                    {EVENT_LABELS[item.type]} <span className="font-mono tabular-nums">{item.count}</span>
                  </li>
                ))}
              </ul>
              <ul lang={assessment.language} className="flex flex-wrap gap-2 pt-1">
                {differences.map((event, index) => (
                  <li key={index} className="panel px-3 py-2 text-sm shadow-none">
                    <span className="meta flex items-center gap-1.5 text-xs">
                      <span
                        className={`size-2 rounded-[2px] ${EVENT_SWATCH[event.type as DifferenceType]}`}
                        aria-hidden="true"
                      />
                      {EVENT_LABELS[event.type]}
                    </span>
                    {eventText(event)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {complete && <AiRecommendation assessmentId={assessment.id} />}

      {complete && (
        <section aria-labelledby="activity-heading" className="space-y-3">
          <h2 id="activity-heading" className="text-lg font-semibold">
            Recommended activity
          </h2>
          <p className="text-sm text-ink-2">
            {suggested
              ? "The suggested activity is marked below. You can choose any activity."
              : "No automatic suggestion. Teacher review recommended."}
          </p>
          <p className="note-dashed font-medium">Suggested activity is a demo rule, not a diagnosis.</p>
          <InterventionPicker
            assessmentId={assessment.id}
            language={assessment.language}
            suggested={suggested}
            chosen={assessment.interventionId}
            learnerId={assessment.learnerId}
          />
        </section>
      )}

      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-2 sm:max-w-xl">
          Saving an activity records the teacher&apos;s plan. Progress shows only checks that were
          already linked; saving a plan does not create a follow-up or change any scores.
        </p>
        <Link href={`/progress/${assessment.learnerId}`} className="btn btn-primary w-full sm:w-auto sm:shrink-0">
          View learner progress
          <ArrowRightIcon size={18} />
        </Link>
      </div>
    </main>
  );
}
