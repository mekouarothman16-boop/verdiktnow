"use client";

import { useState } from "react";

/** Replaces native <details> with a controlled disclosure so the answer's
 * height can transition instead of snapping open/closed. */
export function FAQItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[16px] border border-line bg-bg overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full cursor-pointer px-5 py-4 font-sans text-[14.5px] font-semibold text-ink flex items-center justify-between gap-4 text-left"
      >
        {question}
        <span
          className="shrink-0 w-6 h-6 rounded-full bg-accent-soft text-accent-deep flex items-center justify-center text-[15px] leading-none transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[13.5px] text-ink-soft leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}
