import type { AssessmentRow } from "@/lib/types";

// Owner: Member 4. Provenance labels shown on results and progress.
// Dashed notes: the data did not come from a live recording.
export function ProvenanceLabels({
  assessment,
}: {
  assessment: Pick<AssessmentRow, "demoTranscript" | "seededDemo" | "inputMode">;
}) {
  if (!assessment.demoTranscript && !assessment.seededDemo && assessment.inputMode !== "tap") {
    return null;
  }
  return (
    <div className="space-y-2">
      {assessment.inputMode === "tap" && (
        <p className="note-dashed">
          <strong className="font-semibold">Offline tap.</strong> The teacher marked missed words.
          This was not transcribed from a recording.
        </p>
      )}
      {assessment.demoTranscript && (
        <p className="note-dashed">
          <strong className="font-semibold">Demo Mode.</strong> This transcript was not produced by
          a live recording.
        </p>
      )}
      {assessment.seededDemo && (
        <p className="note-dashed">
          <strong className="font-semibold">Seeded demo assessment.</strong>
        </p>
      )}
    </div>
  );
}
