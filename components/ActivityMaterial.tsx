import type { ReactNode } from "react";
import { normalize } from "@/lib/reading";
import type { InterventionId, SupportedLanguage, WordEvent } from "@/lib/types";

// The learner's side of each practice-guide step: the passage, question or
// words to show the learner, built from this check's passage and its word
// differences. Learner-facing text is in the passage language.

const PROMPTS: Record<SupportedLanguage, { mainIdea: string; chooseIdea: string; meaning: string }> = {
  fil: {
    mainIdea: "Tungkol saan ang talatang ito?",
    chooseIdea: "Alin ang pangunahing ideya? Bakit?",
    meaning: "Ano ang naintindihan mo sa kuwento?",
  },
  en: {
    mainIdea: "What is this paragraph mostly about?",
    chooseIdea: "Which sentence tells the main idea? Why?",
    meaning: "What is the story about, in your own words?",
  },
};

function sentences(text: string): string[] {
  const found = text.match(/[^.!?]+[.!?]+["”’]?/g)?.map((sentence) => sentence.trim()).filter(Boolean);
  return found && found.length > 0 ? found : [text.trim()];
}

// A short paragraph to read together: the first three sentences.
function shortParagraph(text: string): string[] {
  return sentences(text).slice(0, 3);
}

function bare(word: string): string {
  return word.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, "");
}

// Words the learner read differently in this check, else the longest words.
function practiceWords(passage: string, differences: WordEvent[]) {
  const words = passage.split(/\s+/).filter(Boolean);
  const tokens = words.map((word) => normalize(word)[0] ?? "");
  const missed = [
    ...new Set(
      differences
        .filter((event) => (event.type === "substitution" || event.type === "omission") && event.expected)
        .map((event) => event.expected as string),
    ),
  ].filter((token) => tokens.includes(token));
  const fromCheck = missed.length > 0;
  const chosen = fromCheck
    ? missed.slice(0, 5)
    : [...new Set(tokens.filter(Boolean))].sort((a, b) => b.length - a.length).slice(0, 4);
  return {
    fromCheck,
    items: chosen.map((token) => {
      const index = tokens.indexOf(token);
      return {
        token,
        word: bare(words[index]),
        before: words.slice(Math.max(0, index - 1), index).join(" "),
        after: words.slice(index + 1, index + 3).join(" "),
      };
    }),
  };
}

function Passage({ text, language, highlight = [] }: { text: string; language: SupportedLanguage; highlight?: string[] }) {
  return (
    <p lang={language} className="text-[1.375rem] leading-relaxed text-ink">
      {text.split(/\s+/).map((word, index) => (
        <span key={index}>
          {highlight.includes(normalize(word)[0] ?? "") ? (
            <mark className="rounded-md bg-sun-wash px-1 text-ink">{word}</mark>
          ) : (
            word
          )}{" "}
        </span>
      ))}
    </p>
  );
}

function Prompt({ text, language }: { text: string; language: SupportedLanguage }) {
  return (
    <p lang={language} className="text-2xl font-semibold leading-snug text-teal-deep">
      {text}
    </p>
  );
}

type ActivityMaterialProps = {
  activity: InterventionId;
  step: number;
  passage: string;
  language: SupportedLanguage;
  differences: WordEvent[];
};

export function ActivityMaterial({ activity, step, passage, language, differences }: ActivityMaterialProps) {
  const paragraph = shortParagraph(passage);
  const prompts = PROMPTS[language];
  let label = "Show the learner";
  let body: ReactNode;

  if (activity === "main-idea") {
    if (step === 0) {
      label = "Read this together";
      body = <Passage text={paragraph.join(" ")} language={language} />;
    } else if (step === 1) {
      body = (
        <div className="space-y-3">
          <Prompt text={prompts.mainIdea} language={language} />
          <p lang={language} className="text-base text-ink-2">
            {paragraph.join(" ")}
          </p>
        </div>
      );
    } else {
      label = "The learner points to one sentence";
      body = (
        <div className="space-y-3">
          <Prompt text={prompts.chooseIdea} language={language} />
          <ol lang={language} className="space-y-2">
            {paragraph.map((sentence, index) => (
              <li key={sentence} className="flex gap-3 rounded-xl border border-line bg-sheet p-3 text-lg">
                <span className="font-mono text-base font-semibold text-teal">{index + 1}</span>
                {sentence}
              </li>
            ))}
          </ol>
        </div>
      );
    }
  } else if (activity === "word-practice") {
    const practice = practiceWords(passage, differences);
    if (step === 0) {
      label = practice.fromCheck ? "Words from this check to practice" : "Words from the passage to practice";
      body = (
        <ul lang={language} className="flex flex-wrap gap-3">
          {practice.items.map((item) => (
            <li key={item.token} className="rounded-xl border border-line bg-sheet px-4 py-3 text-3xl font-semibold text-ink">
              {item.word}
            </li>
          ))}
        </ul>
      );
    } else if (step === 1) {
      label = "Read each phrase";
      body = (
        <ul lang={language} className="space-y-2">
          {practice.items.map((item) => (
            <li key={item.token} className="rounded-xl border border-line bg-sheet p-3 text-xl">
              {item.before && `${item.before} `}
              <mark className="rounded-md bg-sun-wash px-1 font-semibold text-ink">{item.word}</mark>
              {item.after && ` ${item.after}`}
            </li>
          ))}
        </ul>
      );
    } else {
      label = "Reread together";
      body = <Passage text={passage} language={language} highlight={practice.items.map((item) => item.token)} />;
    }
  } else if (step < 2) {
    label = step === 0 ? "You read it first" : "Read it together";
    body = <Passage text={paragraph.join(" ")} language={language} />;
  } else {
    label = "The learner reads it again";
    body = (
      <div className="space-y-4">
        <Passage text={paragraph.join(" ")} language={language} />
        <Prompt text={prompts.meaning} language={language} />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink/10 bg-white p-4 md:p-5">
      <p className="meta text-xs font-semibold">{label}</p>
      {body}
    </div>
  );
}
