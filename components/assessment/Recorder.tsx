"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_RECORDING_SECONDS } from "@/lib/assessment/contract";

const PREFERRED_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

type Session = {
  stream: MediaStream;
  recorder: MediaRecorder | null;
  timer: number | null;
};

type RecorderProps = {
  // Called after microphone permission is granted. Return false to cancel.
  onStart: () => Promise<boolean>;
  onRecorded: (audio: Blob) => void;
  onError: (message: string) => void;
};

// Browser MediaRecorder with a timer and Stop. The microphone is requested on
// Start and released on stop, failure and unmount. Audio stays in memory.
export function Recorder({ onStart, onRecorded, onError }: RecorderProps) {
  const [state, setState] = useState<"idle" | "starting" | "recording">("idle");
  const [elapsed, setElapsed] = useState(0);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    const sessionHolder = sessionRef;
    return () => {
      endSession(sessionHolder.current, false);
      sessionHolder.current = null;
    };
  }, []);

  async function start() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      onError(
        "The microphone needs a secure page. Open the app at http://localhost or over HTTPS, then try again.",
      );
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      onError("This browser cannot record audio. Use a current version of Chrome, Edge, Firefox or Safari.");
      return;
    }

    setState("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      setState("idle");
      onError(microphoneMessage(error));
      return;
    }
    const session: Session = { stream, recorder: null, timer: null };
    sessionRef.current = session;

    let started = false;
    try {
      started = await onStart();
    } catch {
      started = false;
    }
    if (!started || sessionRef.current !== session) {
      endSession(session, false);
      setState("idle");
      return;
    }

    const mimeType = PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      endSession(session, false);
      setState("idle");
      onError("Recording could not start in this browser. Try again.");
      return;
    }

    const chunks: Blob[] = [];
    let failed = false;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => {
      failed = true;
    };
    recorder.onstop = () => {
      // The browser can stop on its own after an error, so clear the timer here too.
      clearTimer(session);
      releaseMicrophone(session);
      if (sessionRef.current === session) sessionRef.current = null;
      setState("idle");
      const audio = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      chunks.length = 0;
      if (failed) {
        onError("Recording stopped because of a microphone error. Record again.");
      } else if (audio.size === 0) {
        onError("The recording was empty. Check the microphone and record again.");
      } else {
        onRecorded(audio);
      }
    };

    session.recorder = recorder;
    const startedAt = performance.now();
    setElapsed(0);
    session.timer = window.setInterval(() => {
      const seconds = Math.floor((performance.now() - startedAt) / 1000);
      setElapsed(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) endSession(session, true);
    }, 250);
    recorder.start();
    setState("recording");
  }

  function stop() {
    endSession(sessionRef.current, true);
  }

  if (state === "recording") {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 font-semibold" role="status" aria-live="polite">
          <span className="size-3 rounded-full bg-red-600" aria-hidden="true" />
          Recording {formatTime(elapsed)}
        </p>
        <button
          type="button"
          onClick={stop}
          className="min-h-12 w-full rounded-lg bg-red-700 px-4 font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Stop recording
        </button>
        <p className="text-sm text-neutral-600">
          Recording stops automatically at {formatTime(MAX_RECORDING_SECONDS)}.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={state === "starting"}
      className="min-h-12 w-full rounded-lg bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      {state === "starting" ? "Starting microphone…" : "Start recording"}
    </button>
  );
}

// stopRecorder=true finishes the recording (onstop uploads it); false discards it.
function endSession(session: Session | null, stopRecorder: boolean) {
  if (!session) return;
  clearTimer(session);
  const recorder = session.recorder;
  if (recorder && recorder.state !== "inactive") {
    if (!stopRecorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
    }
    recorder.stop();
  }
  if (!stopRecorder || !recorder) releaseMicrophone(session);
}

function clearTimer(session: Session) {
  if (session.timer !== null) {
    window.clearInterval(session.timer);
    session.timer = null;
  }
}

function releaseMicrophone(session: Session) {
  session.stream.getTracks().forEach((track) => track.stop());
}

function microphoneMessage(error: unknown): string {
  // getUserMedia rejects with a DOMException; read its name without assuming the prototype chain.
  const name =
    error && typeof error === "object" && "name" in error && typeof error.name === "string"
      ? error.name
      : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Microphone permission was blocked. Allow the microphone in the browser's site settings, then try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No microphone was found. Connect a microphone, then try again.";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "The microphone is busy or could not start. Close other apps using it, then try again.";
  }
  return "The microphone could not start. Check the browser's microphone permission, then try again.";
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
