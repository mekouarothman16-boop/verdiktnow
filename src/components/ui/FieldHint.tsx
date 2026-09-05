"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

export function FieldHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label="Aide sur ce champ"
        className="text-ink-faint hover:text-accent transition-colors align-middle"
      >
        <AlertCircle size={13} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-30 left-0 top-[calc(100%+6px)] w-[230px] px-3 py-2 rounded-[12px] bg-ink text-white text-[11.5px] leading-relaxed shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
