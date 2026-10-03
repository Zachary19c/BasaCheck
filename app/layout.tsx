import type { Metadata } from "next";
import { Fredoka, Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/ui/AppHeader";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-geist-mono" });
// Display face for headings and the wordmark: round, bold and easy to read.
const fredoka = Fredoka({ subsets: ["latin", "latin-ext"], variable: "--font-fredoka" });

export const metadata: Metadata = {
  title: "BasaCheck",
  description: "Teacher-led reading checks in Filipino and English.",
};

// Design contract (impeccable). Kept in the markup so reviews can audit it.
const CONTRACT = `<!--
THESIS: a reading check that feels like a teacher's framed notebook page, not an analytics dashboard; numbers are measurements, never verdicts.
OWN-WORLD: plain grey paper inside a tan frame; ink type in Geist and Geist Mono; Fredoka Bold headings and wordmark; soft paper sheets and speech bubbles; bAI teal for measured ticks and actions, book-yellow for highlights.
STORY: judges see what BasaCheck does and why its numbers can be trusted, then open the working dashboard; teachers run a check without friction.
FIRST VIEWPORT: big Fredoka headline left, ASCII book turning its pages right, one primary action (Open dashboard) under a short explanation; bAI greets first.
FORM: user-pinned references (pixel hero with scan-drawn object, tick-ring gauge, framed tutor splash); no roll.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-ink">
        <div hidden dangerouslySetInnerHTML={{ __html: CONTRACT }} />
        <div className="viewport-frame" aria-hidden="true" />
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
