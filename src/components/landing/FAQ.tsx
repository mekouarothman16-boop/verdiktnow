import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { Reveal } from "./Reveal";
import { getServerDictionary } from "@/i18n/getDictionary";

export async function FAQ() {
  const { faq: t } = (await getServerDictionary()).landing;

  return (
    <section id="faq" className="bg-surface border-y border-line">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-20 sm:py-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-[22px] h-0.5 bg-accent rounded-full" />
                <Eyebrow>{t.eyebrow}</Eyebrow>
              </div>
              <h2 className="font-display text-[30px] sm:text-[36px] font-extrabold tracking-[-0.015em] text-ink mb-4 text-balance">
                {t.title}
              </h2>
              <p className="text-ink-soft text-[14.5px] leading-relaxed mb-7">{t.intro}</p>
              <LocaleLink
                href="/aide"
                className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition"
              >
                {t.ctaLabel} <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </LocaleLink>
            </div>
          </Reveal>

          <div className="lg:col-span-8 flex flex-col gap-3">
            {t.items.map((item, i) => (
              <Reveal key={item.q} delay={i * 0.05}>
                <details
                  open={i === 0}
                  className="group rounded-xl border border-line bg-bg overflow-hidden"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 font-sans text-[14.5px] font-semibold text-ink flex items-center justify-between gap-4">
                    {item.q}
                    <span className="shrink-0 w-6 h-6 rounded-full bg-accent-soft text-accent-deep flex items-center justify-center text-[15px] leading-none group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-[13.5px] text-ink-soft leading-relaxed">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
