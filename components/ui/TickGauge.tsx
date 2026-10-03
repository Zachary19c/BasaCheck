// Segmented tick ring for one percentage (Passage Reading Accuracy or
// Comprehension). The number is real text beside it; the ring is decoration.
// Ticks are neutral teal for every value: no color implies a benchmark.

type TickGaugeProps = {
  value: number | null;
  size?: number;
  ticks?: number;
  // Shown inside the ring under the number, e.g. "2 of 3".
  caption?: string;
  // Formatted number to show instead of the rounded percentage.
  display?: string;
  className?: string;
};

export function TickGauge({
  value,
  size = 132,
  ticks = 60,
  caption,
  display,
  className = "",
}: TickGaugeProps) {
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  const lit = Math.round((clamped / 100) * ticks);
  const small = size < 100;
  const outer = 48;
  const inner = small ? 37 : 39;

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
        {Array.from({ length: ticks }, (_, index) => {
          const angle = (index / ticks) * Math.PI * 2 - Math.PI / 2;
          const isLit = index < lit;
          const reach = isLit ? inner - 1.5 : inner;
          const x1 = 50 + Math.cos(angle) * reach;
          const y1 = 50 + Math.sin(angle) * reach;
          const x2 = 50 + Math.cos(angle) * outer;
          const y2 = 50 + Math.sin(angle) * outer;
          return (
            <g key={index}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-tick)"
                strokeWidth={small ? 2.2 : 1.8}
                strokeLinecap="round"
              />
              {isLit && (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--color-teal)"
                  strokeWidth={small ? 2.2 : 1.8}
                  strokeLinecap="round"
                  className="tick-lit"
                  style={{ animationDelay: `${120 + index * 14}ms` }}
                />
              )}
            </g>
          );
        })}
        <circle cx="50" cy="50" r={inner - (small ? 5 : 6)} fill="var(--color-sheet)" />
        <circle
          cx="50"
          cy="50"
          r={inner - (small ? 5 : 6)}
          fill="none"
          stroke="rgb(22 22 22 / 0.07)"
          strokeWidth="0.75"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`font-mono font-semibold tabular-nums text-ink ${small ? "text-base" : "text-2xl"}`}
        >
          {value === null ? "—" : (display ?? `${Math.round(clamped)}%`)}
        </span>
        {caption && !small && <span className="meta mt-0.5 text-[0.6875rem]">{caption}</span>}
      </div>
    </div>
  );
}

// The same tick language laid out in a row, for compact comparisons.
export function TickBar({ value, ticks = 24 }: { value: number | null; ticks?: number }) {
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  const lit = Math.round((clamped / 100) * ticks);
  return (
    <span className="flex h-3 items-stretch gap-[2px]" aria-hidden="true">
      {Array.from({ length: ticks }, (_, index) => (
        <span
          key={index}
          className={`w-[3px] rounded-full ${index < lit ? "bg-teal" : "bg-tick"}`}
        />
      ))}
    </span>
  );
}
