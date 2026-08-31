"use client";

import { useEffect, useState } from "react";
import type { LevelInfo } from "@/lib/scoring";

export function GaugeArc({
  score,
  level,
  caption,
}: {
  score: number;
  level: LevelInfo;
  caption?: string;
}) {
  // Animate toward `score` rather than snapping to it — on first mount this
  // fills the arc from 0 (a live "score just came in" read instead of a
  // static illustration); on later prop changes (live diagnostic scoring)
  // it keeps the same smooth transition between values as before.
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setDisplay(score), 30);
    return () => clearTimeout(id);
  }, [score]);

  const path = "M18 104 A 92 92 0 0 1 202 104";
  return (
    <div className="relative w-full">
      <svg viewBox="0 0 220 132" className="w-full block">
        <path d={path} fill="none" stroke="var(--color-line-soft)" strokeWidth={15} strokeLinecap="round" />
        <path
          d={path}
          fill="none"
          stroke={level.color}
          strokeWidth={15}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 - display}
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1), stroke .3s cubic-bezier(.22,1,.36,1)" }}
        />
        <text x="18" y="128" fontFamily="var(--font-mono)" fontSize="10" fill="var(--color-ink-faint)" textAnchor="middle">0</text>
        <text x="202" y="128" fontFamily="var(--font-mono)" fontSize="10" fill="var(--color-ink-faint)" textAnchor="middle">100</text>
      </svg>
      <div className="absolute top-[37%] left-0 right-0 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="font-mono text-[44px] font-semibold text-ink leading-none tabular-nums">{display}</span>
          <span className="font-mono text-[15px] text-ink-faint">/100</span>
        </div>
        {caption && <div className="text-[10.5px] text-ink-faint mt-0.5">{caption}</div>}
      </div>
    </div>
  );
}
