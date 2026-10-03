"use client";

import { AsciiObject } from "@/components/canvasui/AsciiObject";

// The landing page's open book, redrawn in ASCII by canvasui's AsciiObject.
// public/models/book.glb carries the page-flip animation (scripts/build-book-model.mjs).
export function AsciiBook({ className }: { className?: string }) {
  return (
    <AsciiObject
      src="/models/book.glb"
      className={className}
      charset={" .,:;-=+*#/\\|_()"}
      colored={false}
      color="#161616"
      background=""
      cellSize={10}
      cellAspect={0.6}
      contrast={1.2}
      edgeContrast={3.5}
      exposure={0.68}
      highlight="#1d7c84"
      scale={4}
      floatIntensity={1.1}
      rotationIntensity={0.9}
      floatSpeed={1.3}
      orbit
      zoom={false}
    />
  );
}
