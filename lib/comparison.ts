import type { AssessmentRow } from "@/lib/types";

// Owner: Member 4. Compares an explicitly linked baseline and follow-up.
// Never pairs by creation time: a follow-up must name the baseline in
// baselineAssessmentId and share its learner, language and passage.

export const COMPARISON_NOTE =
  "This compares the linked baseline and follow-up. It does not show that the activity caused the change.";
export const MISMATCH_MESSAGE =
  "This follow-up is not linked. Learner, language, or passage does not match the baseline.";
export const NO_FOLLOW_UP_MESSAGE = "No comparable follow-up is shown for this check yet.";

const MINUS = "\u2212";

export type ComparisonResult =
  | { kind: "pair"; baseline: AssessmentRow; followUp: AssessmentRow; lines: string[] }
  | { kind: "mismatch"; baseline: AssessmentRow; followUp: AssessmentRow }
  | { kind: "none"; baseline: AssessmentRow };

export function round1(value: number): number {
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatNumber(value: number): string {
  return String(round1(value));
}

export function isLinkedFollowUp(baseline: AssessmentRow, followUp: AssessmentRow): boolean {
  return (
    followUp.id !== baseline.id &&
    followUp.baselineAssessmentId === baseline.id &&
    followUp.learnerId === baseline.learnerId &&
    followUp.language === baseline.language &&
    followUp.passageId === baseline.passageId
  );
}

function change(before: number, after: number, unit: string): string {
  const delta = round1(round1(after) - round1(before));
  if (delta === 0) return `(no change in ${unit})`;
  const sign = delta > 0 ? "+" : MINUS;
  return `(${sign}${formatNumber(Math.abs(delta))} ${unit})`;
}

function percentLine(label: string, before: number | null, after: number | null): string {
  if (before === null || after === null) return `${label}: not recorded`;
  return `${label}: ${formatNumber(before)}% → ${formatNumber(after)}% ${change(before, after, "percentage points")}`;
}

function rateLine(before: number | null, after: number | null): string {
  if (before === null || after === null) return "Reading Rate: not recorded";
  return `Reading Rate: ${formatNumber(before)} → ${formatNumber(after)} words per minute ${change(before, after, "words per minute")}`;
}

export function compareAssessments(
  baseline: AssessmentRow,
  followUp: AssessmentRow | null,
): ComparisonResult {
  if (!followUp) return { kind: "none", baseline };
  if (!isLinkedFollowUp(baseline, followUp)) return { kind: "mismatch", baseline, followUp };
  return {
    kind: "pair",
    baseline,
    followUp,
    lines: [
      percentLine("Passage Reading Accuracy", baseline.accuracyPercent, followUp.accuracyPercent),
      percentLine("Comprehension", baseline.comprehensionPercent, followUp.comprehensionPercent),
      rateLine(baseline.wpm, followUp.wpm),
    ],
  };
}

// Builds one comparison per baseline (a row with no baselineAssessmentId),
// plus a mismatch entry for any follow-up whose link does not hold. Each
// follow-up is matched only through its own baselineAssessmentId.
export function buildComparisons(rows: AssessmentRow[]): ComparisonResult[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const results: ComparisonResult[] = [];
  const pairedBaselines = new Set<string>();

  for (const followUp of rows) {
    if (followUp.baselineAssessmentId === null) continue;
    const baseline = byId.get(followUp.baselineAssessmentId);
    if (!baseline) continue;
    const result = compareAssessments(baseline, followUp);
    results.push(result);
    if (result.kind === "pair") pairedBaselines.add(baseline.id);
  }

  for (const row of rows) {
    if (row.baselineAssessmentId === null && !pairedBaselines.has(row.id)) {
      results.push(compareAssessments(row, null));
    }
  }
  return results;
}
