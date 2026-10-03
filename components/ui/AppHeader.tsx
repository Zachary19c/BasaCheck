"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// One header for the landing page (wide, with the judge-facing links) and the
// teacher screens (phone-width column).
export function AppHeader() {
  const pathname = usePathname();
  const landing = pathname === "/";
  // The dashboard lays learners out side by side on wide screens, so the
  // header widens with it; the other teacher screens stay phone-width.
  const wide = landing || pathname === "/dashboard";

  return (
    <header className="relative z-10">
      <div
        className={`mx-auto flex items-center justify-between gap-4 px-6 pt-6 pb-2 md:pt-8 ${
          wide ? "max-w-md sm:max-w-6xl sm:px-10" : "max-w-md"
        }`}
      >
        <Link href={landing ? "/" : "/dashboard"} className="flex items-center gap-2.5">
          <Image src="/bai.jpg" alt="" width={64} height={64} className="size-8 rounded-[9px]" />
          <span className="title-display text-[1.375rem] text-ink">BasaCheck</span>
        </Link>
        {landing ? (
          <nav aria-label="Landing" className="flex items-center gap-6 text-sm text-ink-2">
            <a href="#how" className="hidden hover:text-ink md:inline">
              How it works
            </a>
            <a href="#honest" className="hidden hover:text-ink md:inline">
              What it won&apos;t do
            </a>
            <Link href="/dashboard" className="btn btn-primary min-h-10 px-4 text-sm">
              Open dashboard
            </Link>
          </nav>
        ) : (
          <span className="tag">
            <span className="size-1.5 rounded-full bg-teal" aria-hidden="true" />
            Teacher view
          </span>
        )}
      </div>
    </header>
  );
}
