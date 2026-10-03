import "server-only";

// DEMO_MODE=true: every new assessment uses its passage's prepared fixture and
// is labeled as a demo transcript from creation. Server-only on purpose.
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
