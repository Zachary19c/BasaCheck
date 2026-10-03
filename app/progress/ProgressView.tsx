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
  return (
    <article className="panel space-y-4 p-5">
      <p className="meta text-sm">
        {title} · {result.baseline.language === "fil" ? "Filipino" : "English"}
      </p>

      {result.kind === "pair" && (
        <>
          <h3 className="text-lg font-semibold">Observed change after intervention</h3>
          <p className="text-sm text-ink-2">{COMPARISON_NOTE}</p>
          <ul className="space-y-1.5 rounded-xl bg-teal-wash/70 p-4 text-sm font-medium leading-relaxed tabular-nums text-teal-deep">
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
          <p role="note" className="note-dashed">
            {MISMATCH_MESSAGE}
          </p>
          <CheckSummary title="Baseline" assessment={result.baseline} />
          <CheckSummary title="Unlinked follow-up" assessment={result.followUp} />
        </>
      )}

      {result.kind === "none" && (
        <>
          <CheckSummary title="Baseline" assessment={result.baseline} />
          <p className="text-sm text-ink-2">{NO_FOLLOW_UP_MESSAGE}</p>
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
        <p className="text-sm text-ink-2">No completed checks yet.</p>
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
