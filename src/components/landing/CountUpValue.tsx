"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/** Counts up to the leading number in a stat string ("2 %" -> 0..2, "61 %"
 * -> 0..61) when it scrolls into view, keeping the rest of the string
 * (unit, spacing) intact. Falls back to the plain string if it can't find a
 * leading number, so it's safe for any future dictionary value. */
export function CountUpValue({ value, duration = 1.1 }: { value: string; duration?: number }) {
  const match = value.match(/^(-?\d+(?:[.,]\d+)?)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();
  const target = match ? parseFloat(match[1].replace(",", ".")) : null;
  const [display, setDisplay] = useState(target !== null ? 0 : null);

  useEffect(() => {
    if (target === null || !inView) return;
    if (reduceMotion) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const ms = duration * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, reduceMotion]);

  if (target === null || !match) {
    return <span>{value}</span>;
  }

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {match[2]}
    </span>
  );
}
