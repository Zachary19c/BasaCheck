"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// bAI, BasaCheck's heron, greets on the landing page ("intro") and waits with
// the teacher while a page loads ("loading"). Both play the same entrance.

const GREETING = "Hi! I'm bAI, your reading buddy.";
const LOADING = "Opening your page";

function useTyped(text: string, startDelay: number) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const instant = window.setTimeout(() => setCount(text.length), 0);
      return () => window.clearTimeout(instant);
    }
    let timer = 0;
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        setCount((value) => {
          if (value >= text.length) {
            window.clearInterval(timer);
            return value;
          }
          return value + 1;
        });
      }, 32);
    }, startDelay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [text, startDelay]);
  return count;
}

function Heron({ size }: { size: number }) {
  return (
    <div className="splash-heron flex flex-col items-center">
      <div className="splash-heron-idle">
        <Image
          src="/bai.jpg"
          alt=""
          width={640}
          height={640}
          priority
          sizes={`${size}px`}
          className="mascot"
          style={{ width: size, height: size }}
        />
      </div>
      <div
        className="splash-shadow mt-4 h-2.5 rounded-[50%] bg-ink/25 blur-[3px]"
        style={{ width: size * 0.62 }}
        aria-hidden="true"
      />
    </div>
  );
}

function Bubble({ text, typed, dots }: { text: string; typed: number; dots?: boolean }) {
  return (
    <div className="splash-bubble bubble bubble-tail-down px-5 py-3.5 text-center sm:px-7 sm:py-4">
      <p className="relative text-base text-ink sm:text-lg">
        <span aria-hidden="true" className="invisible">
          {text}
          {dots && "..."}
        </span>
        <span aria-hidden="true" className="absolute inset-0">
          {text.slice(0, typed)}
          {dots && typed >= text.length && (
            <>
              <span className="splash-dot">.</span>
              <span className="splash-dot" style={{ animationDelay: "150ms" }}>
                .
              </span>
              <span className="splash-dot" style={{ animationDelay: "300ms" }}>
                .
              </span>
            </>
          )}
        </span>
        <span className="sr-only">{text}</span>
      </p>
    </div>
  );
}

export function BaiLoading() {
  const typed = useTyped(LOADING, 280);
  return (
    <div
      role="status"
      aria-live="polite"
      className="splash-surface fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 px-6"
    >
      <Bubble text={LOADING} typed={typed} dots />
      <Heron size={128} />
    </div>
  );
}

export function BaiIntro() {
  const [phase, setPhase] = useState<"open" | "leaving" | "closed">("open");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const typed = useTyped(GREETING, 380);

  useEffect(() => {
    if (phase !== "open") return;
    buttonRef.current?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [phase]);

  if (phase === "closed") return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Continue to BasaCheck"
      onClick={() => setPhase("leaving")}
      onKeyDown={(event) => {
        if (event.key === "Escape") setPhase("leaving");
      }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && phase === "leaving") setPhase("closed");
      }}
      className={`splash-surface fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-7 px-6 outline-none ${
        phase === "leaving" ? "splash-leave" : ""
      }`}
    >
      <Bubble text={GREETING} typed={typed} />
      <Heron size={168} />
      <span className="splash-hint mt-6 text-base text-muted sm:text-lg">click anywhere to continue</span>
    </button>
  );
}
