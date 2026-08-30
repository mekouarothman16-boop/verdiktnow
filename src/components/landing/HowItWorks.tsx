import { FileText, Gauge, Calculator, LayoutGrid, ListChecks } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { JourneyDemo } from "./JourneyDemo";
import { getServerDictionary } from "@/i18n/getDictionary";

const ICONS = [FileText, Gauge, Calculator, LayoutGrid, ListChecks];

export async function HowItWorks() {
  const { howItWorks: t } = (await getServerDictionary()).landing;
  return (
    <section id="comment-ca-marche" className="max-w-[1160px] mx-auto px-5 sm:px-6 py-20 sm:py-28">
      <Reveal>
        <div className="flex items-center gap-2.5 mb-3 justify-center">
          <span className="w-[22px] h-0.5 bg-accent rounded-full" />
          <Eyebrow>{t.eyebrow}</Eyebrow>
        </div>
        <h2 className="font-display text-[36px] sm:text-[46px] font-extrabold tracking-[-0.015em] text-ink text-center mb-4 text-balance">
          {t.title}
        </h2>
        <p className="text-ink-soft text-[15.5px] leading-relaxed text-center max-w-[560px] mx-auto mb-14">
          {t.subtitle}
        </p>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mb-16">
          <JourneyDemo />
        </div>
      </Reveal>

      <div className="flex flex-wrap justify-center gap-5">
        {t.steps.map((s, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal key={s.n} delay={i * 0.1} className="w-full sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)]">
              <div className="h-full bg-surface border border-line rounded-xl p-7 shadow-card hover:shadow-card-lg hover:-translate-y-1 transition duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-[10px] bg-accent-soft flex items-center justify-center">
                    <Icon size={20} className="text-accent-deep" />
                  </div>
                </div>
                <div className="font-mono text-xs text-accent font-semibold mb-2">{s.n}</div>
                <h3 className="font-sans text-[18px] font-semibold text-ink mb-2.5">{s.title}</h3>
                <p className="text-[13.5px] text-ink-soft leading-relaxed">{s.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
