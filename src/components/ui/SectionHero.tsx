import { Eyebrow } from "./Eyebrow";

export function SectionHero({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-[22px] h-0.5 bg-accent rounded-full" />
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h1 className="font-display text-[30px] sm:text-[34px] font-extrabold tracking-[-0.015em] text-ink mb-2 leading-[1.08] text-balance">
        {title}
      </h1>
      <p className="text-ink-soft text-[15px] leading-relaxed max-w-[580px]">{sub}</p>
    </div>
  );
}
