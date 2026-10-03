import "server-only";
import type { ApiErrorBody } from "@/lib/assessment/contract";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function apiError(status: number, code: string, message: string) {
  const body: ApiErrorBody = { error: { code, message } };
  return Response.json(body, { status });
}

// Parses a JSON object body; null when the body is missing or not an object.
export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}
