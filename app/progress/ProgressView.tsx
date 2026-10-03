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

function includesDemo(result: ComparisonResult) {
  return (
    result.baseline.seededDemo ||
    result.baseline.demoTranscript ||
    (result.kind !== "none" && (result.followUp.seededDemo || result.followUp.demoTranscript))
  );
}

function realCheckFromMixedPair(result: ComparisonResult): ComparisonResult | null {
  if (result.kind === "none" || !includesDemo(result)) return null;
  const baselineIsReal = !result.baseline.seededDemo && !result.baseline.demoTranscript;
  const followUpIsReal = !result.followUp.seededDemo && !result.followUp.demoTranscript;
  if (result.kind === "pair" && baselineIsReal) {
    return { kind: "none", baseline: result.baseline };
  }
  if (followUpIsReal) return { kind: "none", baseline: result.followUp };
  return null;
}

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
  const demo = includesDemo(result);
  return (
    <article className="space-y-3 rounded-2xl border border-neutral-300 bg-white p-4">
      <p className="text-sm font-medium text-neutral-700">
        {title} · {result.baseline.language === "fil" ? "Filipino" : "English"}
      </p>

      {result.kind === "pair" && (
        <>
          <h3 className="text-lg font-bold">
            {demo ? "Demo score example" : "Change between two checks"}
          </h3>
          <p className="text-sm text-neutral-700">
            {demo
              ? "This comparison includes a sample transcript or preloaded example. These scores do not show this learner’s reading progress or what the chosen activity achieved."
              : COMPARISON_NOTE}
          </p>
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
          <CheckSummary title="Reading check" assessment={result.baseline} />
          <p className="text-sm text-neutral-700">{NO_FOLLOW_UP_MESSAGE}</p>
        </>
      )}
    </article>
  );
}

export function ProgressView({ assessments, passageTitles }: ProgressViewProps) {
  const comparisons = buildComparisons(assessments);
  const realComparisons = comparisons.flatMap((result) => {
    if (!includesDemo(result)) return [result];
    const realCheck = realCheckFromMixedPair(result);
    return realCheck ? [realCheck] : [];
  });
  const demoComparisons = comparisons.filter(includesDemo);

  function renderCard(result: ComparisonResult) {
    return (
      <ComparisonCard
        key={`${result.kind}:${result.baseline.id}:${result.kind === "none" ? "" : result.followUp.id}`}
        result={result}
        title={passageTitles[result.baseline.passageId] ?? "Reading passage"}
      />
    );
  }

  return (
    <section aria-labelledby="progress-comparison-heading" className="space-y-5">
      <div>
        <h2 id="progress-comparison-heading" className="text-lg font-semibold">
          Learner progress
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Recorded readings and teacher-marked checks appear here. Demo scores are kept separately below.
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold">Real reading checks</h3>
        {realComparisons.length === 0 ? (
          <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            No real reading checks yet. Complete a learner recording or teacher-marked check to see progress here.
          </p>
        ) : (
          realComparisons.map(renderCard)
        )}
      </div>
      {demoComparisons.length > 0 && (
        <details className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <summary className="cursor-pointer font-semibold text-amber-950">
            Demo and sample checks ({demoComparisons.length})
          </summary>
          <p className="mt-3 text-sm text-amber-950">
            These use prepared transcripts or preloaded example scores. They are for exploring the app, not measuring this learner’s actual reading progress.
          </p>
          <div className="mt-4 space-y-3">{demoComparisons.map(renderCard)}</div>
        </details>
      )}
    </section>
  );
}
