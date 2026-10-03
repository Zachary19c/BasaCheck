import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiRecommendation } from "@/components/AiRecommendation";
import { InterventionPicker } from "@/components/InterventionPicker";
import { ProvenanceLabels } from "@/components/ProvenanceLabels";
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

const EVENT_LABELS: Record<WordEvent["type"], string> = {
  match: "Match",
  substitution: "Substitution",
  omission: "Omission",
  insertion: "Insertion",
};

const EVENT_STYLES: Record<WordEvent["type"], string> = {
  match: "border-neutral-200 bg-white",
  substitution: "border-amber-300 bg-amber-50",
  omission: "border-red-300 bg-red-50",
  insertion: "border-blue-300 bg-blue-50",
};

function eventText(event: WordEvent): string {
  if (event.type === "substitution") return `${event.expected ?? ""} → ${event.spoken ?? ""}`;
  if (event.type === "insertion") return event.spoken ?? "";
  return event.expected ?? "";
}

function percent(value: number | null) {
  return value === null ? "Not recorded" : `${formatNumber(value)}%`;
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

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-6">
      <header className="space-y-1">
        <Link href="/dashboard" className="text-sm font-medium text-blue-800 underline">
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold">Results</h1>
        <p className="text-neutral-700">
          {(passage as { title: string } | null)?.title ?? "Reading passage"} ·{" "}
          {assessment.language === "fil" ? "Filipino" : "English"}
        </p>
        <ProvenanceLabels assessment={assessment} />
      </header>

      {!complete && (
        <p role="status" className="rounded-lg bg-neutral-100 p-4 text-sm">
          This assessment is not complete yet. Measurements appear after the transcript is
          confirmed and the three questions are answered.
        </p>
      )}

      <section aria-labelledby="measurements-heading" className="space-y-3">
        <h2 id="measurements-heading" className="text-lg font-bold">
          Measurements
        </h2>
        <dl className="grid gap-2">
          <div className="rounded-xl border border-neutral-300 p-4">
            <dt className="text-sm font-semibold text-neutral-700">Passage Reading Accuracy</dt>
            <dd className="mt-1 text-2xl font-bold">{percent(assessment.accuracyPercent)}</dd>
          </div>
          <div className="rounded-xl border border-neutral-300 p-4">
            <dt className="text-sm font-semibold text-neutral-700">Reading Rate</dt>
            <dd className="mt-1 text-2xl font-bold">
              {assessment.wpm === null ? "Not recorded" : `${formatNumber(assessment.wpm)} words per minute`}
            </dd>
          </div>
          <div className="rounded-xl border border-neutral-300 p-4">
            <dt className="text-sm font-semibold text-neutral-700">Comprehension</dt>
            <dd className="mt-1 text-2xl font-bold">{percent(assessment.comprehensionPercent)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="differences-heading" className="space-y-3">
        <h2 id="differences-heading" className="text-lg font-bold">
          Word differences
        </h2>
        {differences.length === 0 ? (
          <p className="text-sm text-neutral-700">
            No word differences recorded.
          </p>
        ) : (
          <ul lang={assessment.language} className="flex flex-wrap gap-2">
            {differences.map((event, index) => (
              <li
                key={index}
                className={`rounded-lg border px-2 py-1 text-sm ${EVENT_STYLES[event.type]}`}
              >
                <span className="block text-xs font-semibold text-neutral-600">
                  {EVENT_LABELS[event.type]}
                </span>
                {eventText(event)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {complete && <AiRecommendation assessmentId={assessment.id} />}

      {complete && (
        <section aria-labelledby="activity-heading" className="space-y-3">
          <h2 id="activity-heading" className="text-lg font-bold">
            Teacher activity
          </h2>
          <p className="text-sm text-neutral-700">
            {suggested
              ? "The suggested activity is marked below. You can choose any activity."
              : "No automatic suggestion. Teacher review recommended."}
          </p>
          <p className="text-sm font-semibold text-neutral-700">
            Suggested activity is a demo rule, not a diagnosis.
          </p>
          <InterventionPicker
            assessmentId={assessment.id}
            language={assessment.language}
            suggested={suggested}
            chosen={assessment.interventionId}
            learnerId={assessment.learnerId}
          />
        </section>
      )}

      <p className="text-sm text-neutral-600">
        Progress compares a check only with the follow-up linked to it. Saving an activity does not
        create that follow-up.
      </p>
      <Link
        href={`/progress/${assessment.learnerId}`}
        className="block min-h-12 rounded-lg bg-teal-700 px-4 py-3 text-center font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        View observed change
      </Link>
    </main>
  );
}
