"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MicIcon, StopIcon } from "@/components/ui/icons";
import { matchLive } from "@/lib/live/match";
import { normalize } from "@/lib/reading";
import type { SupportedLanguage } from "@/lib/types";

// Live practice: the browser's speech recognition (Chrome or Edge, online)
// colors each passage word as the learner reads. Green: read correctly. Red:
// check this word. Stutters and repeats are not counted. Practice only:
// nothing is scored or saved, and no audio reaches BasaCheck's server.

type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: RecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => Recognition;

const SPEECH_LANG: Record<SupportedLanguage, string> = { fil: "fil-PH", en: "en-US" };

function recognitionConstructor(): RecognitionConstructor | null {
  const speechWindow = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function errorMessage(code: string): string {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "Microphone permission was blocked. Allow the microphone in the browser's site settings, then try again.";
  }
  if (code === "network") return "Live practice needs an internet connection. Check the connection and try again.";
  if (code === "audio-capture") return "No microphone was found. Connect a microphone, then try again.";
  if (code === "language-not-supported") return "This browser cannot listen in this language.";
  return "Listening stopped. Try again.";
}

type LivePracticeProps = {
  content: string;
  language: SupportedLanguage;
  onClose: () => void;
};

export function LivePractice({ content, language, onClose }: LivePracticeProps) {
  const [listening, setListening] = useState(false);
  const [heardFinal, setHeardFinal] = useState("");
  const [heardInterim, setHeardInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const wantListening = useRef(false);
  // Text finalized in earlier sessions; Chrome ends a session after silence.
  const committed = useRef("");

  // Passage words as written, each with its token for matching (or none for
  // a stray punctuation mark).
  const words = useMemo(() => {
    let tokenIndex = -1;
    return content
      .split(/\s+/)
      .filter(Boolean)
      .map((text) => {
        const token = normalize(text)[0] ?? null;
        if (token) tokenIndex += 1;
        return { text, token, tokenIndex: token ? tokenIndex : -1 };
      });
  }, [content]);
  const expected = useMemo(() => words.flatMap((word) => (word.token ? [word.token] : [])), [words]);

  const finalTokens = normalize(heardFinal);
  const heard = [...finalTokens, ...normalize(heardInterim)];
  const { status, next } = matchLive(expected, heard, finalTokens.length);
  const correct = status.filter((value) => value === "correct").length;
  const toCheck = status.filter((value) => value === "wrong").length;

  useEffect(
    () => () => {
      wantListening.current = false;
      recognitionRef.current?.abort();
    },
    [],
  );

  function listen() {
    const Recognition = recognitionConstructor();
    if (!Recognition) {
      setError("Live practice works in Chrome or Edge. Open BasaCheck in one of those browsers to use it.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = SPEECH_LANG[language];
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    let sessionFinal = "";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText += ` ${result[0].transcript}`;
        else interimText += ` ${result[0].transcript}`;
      }
      sessionFinal = finalText;
      setHeardFinal(`${committed.current} ${finalText}`);
      setHeardInterim(interimText);
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      wantListening.current = false;
      setError(errorMessage(event.error));
    };
    recognition.onend = () => {
      committed.current = `${committed.current} ${sessionFinal}`;
      setHeardFinal(committed.current);
      setHeardInterim("");
      if (wantListening.current) {
        listen();
      } else {
        recognitionRef.current = null;
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    wantListening.current = true;
    setError(null);
    setListening(true);
    try {
      recognition.start();
    } catch {
      wantListening.current = false;
      setListening(false);
      setError("Listening could not start. Try again.");
    }
  }

  function stop() {
    wantListening.current = false;
    recognitionRef.current?.stop();
  }

  function startOver() {
    stop();
    committed.current = "";
    setHeardFinal("");
    setHeardInterim("");
    setError(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold">
          Live practice <span className="tag tag-sun">Beta</span>
        </p>
        <button type="button" onClick={onClose} className="link-quiet">
          Back to the reading check
        </button>
      </div>

      <p className="note-dashed text-ink-2">
        Practice only: nothing is scored or saved. Works in Chrome or Edge with internet; the browser
        sends the audio to its speech service.
      </p>

      <p lang={language} className="text-[1.375rem] leading-[2.1] text-ink">
        {words.map((word, index) => {
          const state = word.tokenIndex >= 0 ? status[word.tokenIndex] : "pending";
          const current = listening && word.tokenIndex >= 0 && word.tokenIndex === next;
          return (
            <span key={index}>
              <span
                className={`rounded-md px-1 py-0.5 transition-colors duration-75 ${
                  state === "correct"
                    ? "bg-good-wash text-good"
                    : state === "wrong"
                      ? "bg-danger-wash text-danger underline decoration-dotted underline-offset-4"
                      : current
                        ? "bg-teal-wash text-ink"
                        : ""
                }`}
              >
                {word.text}
              </span>{" "}
            </span>
          );
        })}
      </p>

      <p role="status" aria-live="polite" className="text-sm text-ink-2">
        <span className="font-semibold tabular-nums text-ink">
          {correct} of {expected.length}
        </span>{" "}
        words read correctly
        {toCheck > 0 && (
          <>
            {" · "}
            <span className="font-semibold tabular-nums text-danger">{toCheck}</span> to check
          </>
        )}
        {listening && " · Listening…"}
      </p>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-good" aria-hidden="true" />
          Read correctly
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-danger" aria-hidden="true" />
          Check this word
        </li>
        <li>Repeats and stutters are not counted.</li>
      </ul>

      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {listening ? (
          <button type="button" onClick={stop} className="btn btn-danger sm:flex-1">
            <StopIcon size={18} />
            Stop listening
          </button>
        ) : (
          <button type="button" onClick={listen} className="btn btn-primary sm:flex-1">
            <MicIcon size={18} />
            {heard.length > 0 ? "Keep listening" : "Start listening"}
          </button>
        )}
        <button type="button" onClick={startOver} className="btn btn-secondary sm:flex-1">
          Start over
        </button>
      </div>
    </div>
  );
}
