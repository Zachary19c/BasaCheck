import Link from "next/link";
import { ProvenanceLabels } from "@/components/ProvenanceLabels";
import {
  buildComparisons,
  COMPARISON_NOTE,
  type ComparisonResult,
  formatNumber,
  MISMATCH_MESSAGE,
  NO_FOLLOW_UP_MESSAGE,
} from "@/lib/comparison";
import { INTERVENTIONS } from "@/lib/interventions";
import type { AssessmentRow } from "@/lib/types";

// Owner: Member 4. Progress content inside Member 1's progress shell.
// Compares only explicitly linked checks (see lib/comparison.ts).

type ProgressViewProps = {
  assessments: AssessmentRow[];
  passageTitles: Record<string, string>;
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function percent(value: number | null) {
  return value === null ? "Not recorded" : `${formatNumber(value)}%`;
}

function CheckSummary({ title, assessment }: { title: string; assessment: AssessmentRow }) {
  const chosen = assessment.interventionId ? INTERVENTIONS[assessment.interventionId] : null;
  return (
    <div className="space-y-2 rounded-xl bg-neutral-50 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-xs text-neutral-600">{dateLabel(assessment.createdAt)}</p>
      </div>
      <ProvenanceLabels assessment={assessment} />
      <ul className="space-y-1 text-sm">
        <li>Passage Reading Accuracy: {percent(assessment.accuracyPercent)}</li>
        <li>Comprehension: {percent(assessment.comprehensionPercent)}</li>
        <li>
          Reading Rate:{" "}
          {assessment.wpm === null ? "Not recorded" : `${formatNumber(assessment.wpm)} words per minute`}
        </li>
      </ul>
      {chosen && (
        <p className="text-sm text-neutral-700">
          Chosen activity: <span lang="en">{chosen.title.en}</span>
        </p>
      )}
      <Link
        href={`/results/${assessment.id}`}
        className="inline-block text-sm font-medium text-blue-800 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        View results
      </Link>
    </div>
  );
}

function ComparisonCard({ result, title }: { result: ComparisonResult; title: string }) {
  return (
    <article className="space-y-3 rounded-2xl border border-neutral-300 bg-white p-4">
      <p className="text-sm font-medium text-neutral-700">
        {title} · {result.baseline.language === "fil" ? "Filipino" : "English"}
      </p>

      {result.kind === "pair" && (
        <>
          <h3 className="text-lg font-bold">Observed change after intervention</h3>
          <p className="text-sm text-neutral-700">{COMPARISON_NOTE}</p>
          <ul className="space-y-1 rounded-xl border border-neutral-200 p-3 text-sm font-medium">
            {result.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <CheckSummary title="Baseline" assessment={result.baseline} />
          <CheckSummary title="Follow-up" assessment={result.followUp} />
        </>
      )}

      {result.kind === "mismatch" && (
        <>
          <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            {MISMATCH_MESSAGE}
          </p>
          <CheckSummary title="Baseline" assessment={result.baseline} />
          <CheckSummary title="Unlinked follow-up" assessment={result.followUp} />
        </>
      )}

      {result.kind === "none" && (
        <>
          <CheckSummary title="Baseline" assessment={result.baseline} />
          <p className="text-sm text-neutral-700">{NO_FOLLOW_UP_MESSAGE}</p>
        </>
      )}
    </article>
  );
}

export function ProgressView({ assessments, passageTitles }: ProgressViewProps) {
  const comparisons = buildComparisons(assessments);

  return (
    <section aria-labelledby="progress-comparison-heading" className="space-y-4">
      <h2 id="progress-comparison-heading" className="text-lg font-semibold">
        Progress comparison
      </h2>
      {comparisons.length === 0 ? (
        <p className="text-sm text-neutral-600">No completed checks yet.</p>
      ) : (
        comparisons.map((result) => (
          <ComparisonCard
            key={`${result.kind}:${result.baseline.id}:${result.kind === "none" ? "" : result.followUp.id}`}
            result={result}
            title={passageTitles[result.baseline.passageId] ?? "Reading passage"}
          />
        ))
      )}
    </section>
  );
}
