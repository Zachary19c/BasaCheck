import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "BasaCheck",
  description: "Teacher-led reading checks in Filipino and English.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
            <Link className="text-lg font-bold tracking-tight" href="/dashboard">
              BasaCheck
            </Link>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              Teacher view
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
