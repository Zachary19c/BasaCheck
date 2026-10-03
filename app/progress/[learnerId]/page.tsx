import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProgressPage({
  params,
}: PageProps<"/progress/[learnerId]">) {
  const { learnerId } = await params;
  const { data: learner, error } = await createClient()
    .from("learners")
    .select("id, display_name, grade_level")
    .eq("id", learnerId)
    .maybeSingle();

  if (error) throw error;
  if (!learner) notFound();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6">
      <Link className="text-sm font-semibold text-teal-700" href="/dashboard">
        ← Back to dashboard
      </Link>
      <section>
        <p className="text-sm font-medium text-teal-700">Learner progress</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{learner.display_name}</h1>
        <p className="mt-1 text-neutral-600">Grade {learner.grade_level}</p>
      </section>
      <section
        aria-label="Progress comparison"
        className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6"
        data-progress-slot
      >
        <h2 className="text-lg font-semibold">Progress comparison</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          First-check and linked follow-up details will appear here.
        </p>
      </section>
      <p className="text-xs leading-5 text-neutral-500">
        Seeded demo data is illustrative, not evidence of a real intervention.
      </p>
    </main>
  );
}
