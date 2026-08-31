import Image from "next/image";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { GaugeArc } from "@/components/ui/GaugeArc";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getLevels } from "@/lib/scoring";
import { Reveal } from "./Reveal";
import { FillBar } from "./FillBar";
import { getServerDictionary, getRootParamsLocale } from "@/i18n/getDictionary";

export async function Hero() {
  const level = getLevels(await getRootParamsLocale())[3];
  const { hero: t } = (await getServerDictionary()).landing;
  const levers = [
    { label: t.leverStd, v: 82 },
    { label: t.leverRules, v: 74 },
    { label: t.leverData, v: 69 },
  ];
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/generated/hero-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70 animate-bg-drift"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-transparent to-bg" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-52 left-1/2 -translate-x-1/2 w-[1100px] h-[680px] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(closest-side, var(--color-accent-soft), transparent)" }}
      />
      <div className="relative max-w-[1160px] mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/15 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-accent-deep font-medium">
              {t.badge}
            </span>
          </div>
          <h1 className="font-display text-[48px] sm:text-[66px] font-extrabold tracking-[-0.02em] text-ink leading-[1.02] mb-6 text-balance">
            {t.titleLine}{" "}
            <span className="text-accent">{t.titleHighlight}</span>.
          </h1>
          <p className="text-ink-soft text-[17px] sm:text-[18px] leading-relaxed max-w-[520px] mb-9">
            {t.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#tarifs"
              className="group flex items-center gap-2.5 px-7 py-4 rounded-full bg-accent-vivid text-ink text-[16px] font-semibold hover:brightness-95 transition duration-200 shadow-card-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
            >
              {t.ctaPricing} <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <a
              href="#comment-ca-marche"
              className="flex items-center gap-2 px-5 py-3.5 rounded-full text-ink-soft text-[15px] font-semibold hover:text-ink transition"
            >
              <PlayCircle size={19} /> {t.ctaHowItWorks}
            </a>
          </div>
          <div className="inline-flex items-center gap-3 mt-10 pl-2 pr-4 py-2 rounded-full bg-surface/80 border border-line shadow-card backdrop-blur-sm">
            <span className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
              <Sparkles size={13} className="text-accent-deep" />
            </span>
            <span className="flex items-center gap-2 text-[12px] text-ink-soft flex-wrap">
              <span>{t.badgeInstall}</span>
              <span className="w-1 h-1 rounded-full bg-line" />
              <span>{t.badgeSpeed}</span>
              <span className="w-1 h-1 rounded-full bg-line" />
              <span>{t.badgeMethod}</span>
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="relative mx-auto max-w-[420px]">
            <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-accent-soft to-transparent -z-10" />
            <div className="bg-surface border border-line rounded-2xl shadow-card-lg p-7">
              <div className="flex items-center justify-between mb-1">
                <Eyebrow>{t.cardEyebrow}</Eyebrow>
                <span
                  className="px-2.5 py-1 rounded-full text-white font-mono text-[11px] font-semibold"
                  style={{ background: level.color }}
                >
                  {level.label}
                </span>
              </div>
              <GaugeArc score={78} level={level} caption={t.cardCaption} />
              <div className="mt-4 pt-4 border-t border-line-soft space-y-2.5">
                {levers.map((r, i) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-[11.5px] text-ink-soft flex-1">{r.label}</span>
                    <div className="w-20">
                      <FillBar percent={r.v} delay={0.15 + i * 0.1} />
                    </div>
                    <span className="font-mono text-[11px] text-ink w-6 text-right">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
