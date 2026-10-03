import Link from "next/link";
import { ProvenanceLabels } from "@/components/ProvenanceLabels";
import { ArrowRightIcon } from "@/components/ui/icons";
import { TickBar } from "@/components/ui/TickGauge";
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

function MeasureRow({ label, value }: { label: string; value: number | null }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
      <span className="text-ink-2">{label}</span>
      <span className="whitespace-nowrap text-sm font-semibold tabular-nums">{percent(value)}</span>
      <span className="col-span-2">
        <TickBar value={value} ticks={32} />
      </span>
    </li>
  );
}

function CheckSummary({ title, assessment }: { title: string; assessment: AssessmentRow }) {
  const chosen = assessment.interventionId ? INTERVENTIONS[assessment.interventionId] : null;
  return (
    <div className="space-y-3 rounded-xl border border-line bg-paper/60 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-semibold">{title}</h4>
        <p className="meta text-xs">{dateLabel(assessment.createdAt)}</p>
      </div>
      <ProvenanceLabels assessment={assessment} />
      <ul className="space-y-3 text-sm">
        <MeasureRow label="Passage Reading Accuracy" value={assessment.accuracyPercent} />
        <MeasureRow label="Comprehension" value={assessment.comprehensionPercent} />
        <li className="flex items-baseline justify-between gap-3">
          <span className="text-ink-2">Reading Rate</span>
          <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
            {assessment.wpm === null ? "Not recorded" : `${formatNumber(assessment.wpm)} words per minute`}
          </span>
        </li>
      </ul>
      {chosen && (
        <p className="text-sm text-ink-2">
          Chosen activity: <span lang="en" className="font-medium text-ink">{chosen.title.en}</span>
        </p>
      )}
      <Link href={`/results/${assessment.id}`} className="link-quiet">
        View results
        <ArrowRightIcon size={16} />
      </Link>
    </div>
  );
}

function ComparisonCard({ result, title }: { result: ComparisonResult; title: string }) {
  const demo = includesDemo(result);
  return (
    <article className="panel h-full space-y-4 p-5">
      <p className="meta text-sm">
        {title} · {result.baseline.language === "fil" ? "Filipino" : "English"}
      </p>

      {result.kind === "pair" && (
        <>
          <h3 className="text-lg font-semibold">
            {demo ? "Demo score example" : "Change between two checks"}
          </h3>
          <p className="text-sm text-ink-2">
            {demo
              ? "This comparison includes a sample transcript or preloaded example. These scores do not show this learner’s reading progress or what the chosen activity achieved."
              : COMPARISON_NOTE}
          </p>
          <ul className="space-y-1.5 rounded-xl bg-teal-wash/70 p-4 text-sm font-medium leading-relaxed tabular-nums text-teal-deep">
            {result.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="grid gap-4 md:grid-cols-2">
            <CheckSummary title="Baseline" assessment={result.baseline} />
            <CheckSummary title="Follow-up" assessment={result.followUp} />
          </div>
        </>
      )}

      {result.kind === "mismatch" && (
        <>
          <p role="note" className="note-dashed">
            {MISMATCH_MESSAGE}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <CheckSummary title="Baseline" assessment={result.baseline} />
            <CheckSummary title="Unlinked follow-up" assessment={result.followUp} />
          </div>
        </>
      )}

      {result.kind === "none" && (
        <>
          <CheckSummary title="Reading check" assessment={result.baseline} />
          <p className="text-sm text-ink-2">{NO_FOLLOW_UP_MESSAGE}</p>
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

  // Linked pairs read across the page; single checks sit in a grid on wide screens.
  function renderList(results: ComparisonResult[]) {
    const linked = results.filter((result) => result.kind !== "none");
    const single = results.filter((result) => result.kind === "none");
    return (
      <>
        {linked.map(renderCard)}
        {single.length > 0 && (
          <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">{single.map(renderCard)}</div>
        )}
      </>
    );
  }

  return (
    <section aria-labelledby="progress-comparison-heading" className="space-y-6">
      <div>
        <h2 id="progress-comparison-heading" className="text-lg font-semibold">
          Learner progress
        </h2>
        <p className="mt-1 text-sm text-ink-2">
          Recorded readings and teacher-marked checks appear here. Demo scores are kept separately below.
        </p>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold">Real reading checks</h3>
        {realComparisons.length === 0 ? (
          <p className="note-dashed text-ink-2">
            No real reading checks yet. Complete a learner recording or teacher-marked check to see progress here.
          </p>
        ) : (
          renderList(realComparisons)
        )}
      </div>
      {demoComparisons.length > 0 && (
        <details className="group rounded-[14px] border border-dashed border-ink/40 bg-sheet/60 p-5">
          <summary className="cursor-pointer font-semibold text-ink">
            Demo and sample checks ({demoComparisons.length})
          </summary>
          <p className="mt-3 text-sm text-ink-2">
            These use prepared transcripts or preloaded example scores. They are for exploring the app, not measuring this learner’s actual reading progress.
          </p>
          <div className="mt-4 space-y-4">{renderList(demoComparisons)}</div>
        </details>
      )}
    </section>
  );
}
