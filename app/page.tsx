import Image from "next/image";
import Link from "next/link";
import { BaiIntro } from "@/components/bai/BaiSplash";
import { AsciiBook } from "@/components/landing/AsciiBook";
import { ArrowRightIcon, ChevronRightIcon } from "@/components/ui/icons";
import { TickGauge } from "@/components/ui/TickGauge";

const STEPS = [
  {
    title: "Choose a passage",
    body: "Filipino or English, matched to the learner's grade. Original texts in the Phil-IRI form.",
  },
  {
    title: "Read aloud, or tap",
    body: "Record the learner, or mark missed words offline with no microphone at all.",
  },
  {
    title: "Confirm the words",
    body: "Speech recognition only drafts the transcript. Nothing is scored until the teacher confirms it.",
  },
  {
    title: "Ask three questions",
    body: "Comprehension questions in Phil-IRI order, then the results and an activity the teacher picks.",
  },
];

const REFUSALS = [
  { title: "No diagnosis", body: "BasaCheck never names a disorder, disability or condition." },
  { title: "No reading levels", body: "It shows measurements. It does not assign an official reading level." },
  {
    title: "No speed judgments",
    body: "Reading Rate is recorded, but it never decides which activity is suggested.",
  },
  { title: "No hidden scoring", body: "Demo rules, not validated educational benchmarks, and they are labeled that way." },
];

export default function Home() {
  return (
    <>
      <BaiIntro />
      <noscript>
        <style>{".splash-surface{display:none!important}"}</style>
      </noscript>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 md:px-10">
        <section className="grid items-center gap-6 pt-8 sm:min-h-[calc(100svh-7rem)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:gap-4 sm:pt-0">
          <div className="flex flex-col">
            <h1 className="title-display text-[clamp(4.25rem,12vw,7rem)] leading-[0.9] text-ink">
              <span className="block">Basa</span>
              <span className="block text-teal-deep">Check</span>
            </h1>
            <p className="meta mt-4 text-sm">basa: to read, in Filipino</p>
            <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-ink-2 sm:mt-10 lg:mt-16">
              A teacher-led reading check in Filipino and English. Record a learner reading aloud,
              confirm what they said, and BasaCheck scores accuracy and comprehension with plain,
              deterministic code. bAI can explain the results. It never changes them.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/dashboard" className="btn btn-primary">
                Open the dashboard
                <ArrowRightIcon size={18} />
              </Link>
              <a href="#how" className="link-quiet">
                See how it works
                <ChevronRightIcon size={16} />
              </a>
            </div>
            <p className="meta mt-6">Demo data · fictional learners · original passages</p>
          </div>
          <div className="relative -mx-6 h-[360px] sm:mx-0 sm:h-[min(72svh,560px)] lg:h-[min(78svh,680px)]">
            <AsciiBook className="h-full w-full cursor-grab active:cursor-grabbing" />
          </div>
        </section>

        <section id="how" aria-labelledby="how-heading" className="scroll-mt-10 pt-20 md:pt-28">
          <h2 id="how-heading" className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-tight">
            How a check works
          </h2>
          <p className="mt-3 max-w-[40rem] text-ink-2">
            Four steps on a phone, in a few minutes, with the teacher in charge of every one.
          </p>

          <ol className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-3">
                <span className="flex gap-1" aria-hidden="true">
                  {STEPS.map((other, bar) => (
                    <span
                      key={other.title}
                      className={`h-1.5 flex-1 rounded-full ${bar <= index ? "bg-teal" : "bg-tick"}`}
                    />
                  ))}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid items-start gap-8 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:gap-8 lg:gap-12">
            <figure className="panel p-6 md:p-8">
              <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-lg font-semibold">A finished check</span>
                <span className="tag tag-dashed">Sample · fictional data</span>
              </figcaption>
              <dl className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col-reverse items-center gap-2">
                  <dt className="text-sm font-medium text-ink-2">Passage Reading Accuracy</dt>
                  <dd>
                    <TickGauge value={94} caption="accuracy" />
                  </dd>
                </div>
                <div className="flex flex-col-reverse items-center gap-2">
                  <dt className="text-sm font-medium text-ink-2">Comprehension</dt>
                  <dd>
                    <TickGauge value={67} caption="2 of 3 correct" />
                  </dd>
                </div>
              </dl>
              <div className="mt-6 flex items-baseline justify-between border-t border-line pt-4">
                <span className="text-sm text-ink-2">Reading Rate</span>
                <span className="text-sm font-semibold tabular-nums">58 words per minute</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-ink-2">Word differences</p>
                <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                  <li className="tag">
                    <span className="size-2 rounded-[2px] bg-sun" aria-hidden="true" />
                    upang → para
                  </li>
                  <li className="tag">
                    <span className="size-2 rounded-[2px] bg-teal-deep" aria-hidden="true" />
                    skipped: maliit
                  </li>
                </ul>
              </div>
            </figure>

            <div className="flex items-start gap-4 sm:pt-10">
              <Image src="/bai.jpg" alt="" width={128} height={128} className="mascot size-14 shrink-0" />
              <div className="bubble bubble-tail-left p-5">
                <p className="text-ink">
                  I&apos;m <strong>bAI</strong>. Every number here comes from BasaCheck&apos;s scoring
                  code. I can explain it in plain words and point to an activity card, and the teacher
                  makes the call.
                </p>
                <p className="meta mt-3">bAI never sees the learner&apos;s name.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="honest" aria-labelledby="honest-heading" className="scroll-mt-10 pt-20 md:pt-28">
          <h2 id="honest-heading" className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-tight">
            What it won&apos;t do
          </h2>
          <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {REFUSALS.map((item) => (
              <div key={item.title} className="border-t border-ink/80 pt-4">
                <dt className="text-base font-semibold">{item.title}</dt>
                <dd className="mt-2 max-w-[30rem] text-ink-2">{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel mt-20 flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between md:mt-28 md:p-8">
          <div>
            <h2 className="text-2xl font-semibold">Try it with Ana, Luis and Elena</h2>
            <p className="mt-1 text-ink-2">Fictional Grade 2, 4 and 6 learners with seeded checks.</p>
          </div>
          <Link href="/dashboard" className="btn btn-primary">
            Open the dashboard
            <ArrowRightIcon size={18} />
          </Link>
        </section>

        <p className="meta mt-10">
          Passages are original texts written in the Phil-IRI form. They are not the national test.
        </p>
      </main>
    </>
  );
}
