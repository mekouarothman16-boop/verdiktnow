"use client";

import { useRef, type ReactNode } from "react";
import { ProcessLine } from "./ProcessLine";

/** Client boundary that owns the ref ProcessLine scrolls against, so the
 * section stack itself (Hero..CTA) can stay server-rendered. */
export function ProcessLineContainer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="relative">
      {children}
      <ProcessLine containerRef={ref} />
    </div>
  );
}
