import type { SupportArea } from "@/lib/types";

// Owner: Member 3. Demo support rule (docs/01-mvp-prd.md). Pure: no auth,
// database or model imports.
//
// These are demo rules, not validated educational benchmarks. The teacher
// decides; a null result means no automatic suggestion and teacher review.
// WPM is intentionally not an input: reading rate never triggers a suggestion.

export const DEMO_COMPREHENSION_THRESHOLD = 60;
export const DEMO_ACCURACY_THRESHOLD = 90;

function assertPercent(value: number, name: string): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${name} must be a finite percentage from 0 to 100.`);
  }
}

// Pass unrounded values; rounding for display must not change the rule.
export function supportArea(
  accuracyPercent: number,
  comprehensionPercent: number,
): SupportArea | null {
  assertPercent(accuracyPercent, "accuracyPercent");
  assertPercent(comprehensionPercent, "comprehensionPercent");

  if (comprehensionPercent < DEMO_COMPREHENSION_THRESHOLD) return "comprehension";
  if (accuracyPercent < DEMO_ACCURACY_THRESHOLD) return "accuracy";
  return null;
}
