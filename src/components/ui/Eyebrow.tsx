import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Eyebrow({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "font-mono text-[11px] tracking-[0.16em] uppercase text-ink-faint font-medium",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
