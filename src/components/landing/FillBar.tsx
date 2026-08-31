"use client";

import { motion } from "framer-motion";

/** A track bar whose fill measures in on scroll — the same "score becomes
 * visible" idea as GaugeArc's stroke-dashoffset animation, reused wherever
 * the landing page shows one of the product's own lever/weight numbers. */
export function FillBar({
  percent,
  className = "h-1.5 bg-line-soft",
  fillClassName = "bg-accent-vivid",
  delay = 0,
}: {
  percent: number;
  className?: string;
  fillClassName?: string;
  delay?: number;
}) {
  return (
    <div className={`rounded-full overflow-hidden ${className}`}>
      <motion.div
        className={`h-full rounded-full ${fillClassName}`}
        initial={{ transform: "scaleX(0)" }}
        whileInView={{ transform: `scaleX(${percent / 100})` }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "left", width: "100%" }}
      />
    </div>
  );
}
