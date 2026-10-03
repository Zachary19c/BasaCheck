import type { AssessmentRow } from "@/lib/types";

// Owner: Member 4. Provenance labels shown on results and progress.
export function ProvenanceLabels({
  assessment,
}: {
  assessment: Pick<AssessmentRow, "demoTranscript" | "seededDemo">;
}) {
  if (!assessment.demoTranscript && !assessment.seededDemo) return null;
  return (
    <div className="space-y-1">
      {assessment.demoTranscript && (
        <p className="rounded bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-900">
          Demo Mode. This transcript was not produced by a live recording.
        </p>
      )}
      {assessment.seededDemo && (
        <p className="rounded bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-900">
          Seeded demo assessment.
        </p>
      )}
    </div>
  );
}
