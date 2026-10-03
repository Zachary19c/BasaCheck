import type { AssessmentRow } from "@/lib/types";

// Owner: Member 4. Provenance labels shown on results and progress.
export function ProvenanceLabels({
  assessment,
}: {
  assessment: Pick<AssessmentRow, "demoTranscript" | "seededDemo" | "inputMode">;
}) {
  if (!assessment.demoTranscript && !assessment.seededDemo && assessment.inputMode !== "tap") {
    return null;
  }
  return (
    <div className="space-y-1">
      {assessment.inputMode === "tap" && (
        <p className="rounded bg-teal-100 px-2 py-1 text-sm font-semibold text-teal-900">
          Offline tap. The teacher marked missed words. This was not transcribed from a recording.
        </p>
      )}
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
