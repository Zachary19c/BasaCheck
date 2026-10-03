import "server-only";

// DEMO_MODE=true offers the prepared-transcript choice before recording.
// The server labels a check as Demo Mode only when the teacher chooses it.
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
