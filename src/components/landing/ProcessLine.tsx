"use client";

import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "framer-motion";

/**
 * Signature scroll motif for the landing page: a vertical thread that fills
 * as the visitor reads, exactly like the product's own GaugeArc fills a
 * score. It is the one connective device between every section on the page
 * (dynamism between sections) and it doubles as a literal restatement of
 * the product's core idea — a process, evaluated, filling in as it goes.
 * Desktop-only (xl+): below that the container gutter is too narrow to
 * hold a line without crowding the content it runs beside.
 */
export function ProcessLine({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });
  const beadTop = useTransform(progress, (v) => `${v * 100}%`);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 bottom-0 left-8 w-px hidden xl:block"
    >
      <div className="absolute inset-0 bg-line" />
      <motion.div
        className="absolute top-0 left-0 w-px bg-accent origin-top"
        style={{ height: "100%", scaleY: reduceMotion ? 1 : progress }}
      />
      {!reduceMotion && (
        <motion.div
          className="absolute left-1/2 w-2.5 h-2.5 -translate-x-1/2 rounded-full bg-accent-vivid"
          style={{
            top: beadTop,
            boxShadow: "0 0 0 4px var(--color-accent-soft), 0 0 16px 2px rgba(215,255,83,0.55)",
          }}
        />
      )}
    </div>
  );
}
