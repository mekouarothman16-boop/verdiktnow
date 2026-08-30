import { HTMLAttributes } from "react";
import clsx from "clsx";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-surface border border-line rounded-xl shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
