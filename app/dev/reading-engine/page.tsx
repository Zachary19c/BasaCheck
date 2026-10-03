import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SupportedLanguage } from "@/lib/types";
import { EngineTester, type DevPassage } from "./engine-tester";

// Owner: Member 3. DEVELOPER TEST PAGE, not one of the four MVP screens.
// Lets the team exercise lib/reading by hand before the assessment routes
// exist. Returns 404 in production builds. Delete before the demo if unwanted.

export const metadata: Metadata = {
  title: "Reading engine test (dev only)",
};

// Passages come straight from Member 1's seed so this page never drifts from
// the real content and needs no database connection.
async function loadSeedPassages(): Promise<DevPassage[]> {
  const seed = await readFile(path.join(process.cwd(), "supabase", "seed.sql"), "utf8");
  const tuple =
    /'([0-9a-f-]{36})'::uuid,\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'(fil|en)'/g;
  const unquote = (s: string) => s.replaceAll("''", "'");

  return [...seed.matchAll(tuple)].map((m) => ({
    id: m[1],
    title: unquote(m[2]),
    content: unquote(m[3]),
    language: m[4] as SupportedLanguage,
  }));
}

export default async function ReadingEngineDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const passages = await loadSeedPassages();
  return <EngineTester passages={passages} />;
}
