import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { Reveal } from "./Reveal";
import { GUTTER, INSET, SHELL } from "./layout";
import { tintWash } from "./tint";
import { FAQItem } from "./FAQItem";
import { getServerDictionary } from "@/i18n/getDictionary";

export async function FAQ() {
  const { faq: t } = (await getServerDictionary()).landing;

  return (
    <section id="faq" className={`${GUTTER} py-6 sm:py-8`}>
      <div
        className={`${SHELL} ${INSET} bg-surface border border-line rounded-[28px] sm:rounded-[36px] py-16 sm:py-24`}
        style={tintWash("lime", "section")}
      >
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-[22px] h-0.5 bg-accent rounded-full" />
                <Eyebrow>{t.eyebrow}</Eyebrow>
              </div>
              <h2 className="font-display text-[30px] sm:text-[36px] font-semibold tracking-[0.005em] text-ink mb-4 text-balance">
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
                <FAQItem question={item.q} answer={item.a} defaultOpen={i === 0} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
