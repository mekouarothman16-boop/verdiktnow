import { SlidersHorizontal, Sparkles, Printer, ShieldCheck, Kanban, TrendingUp } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { getServerDictionary } from "@/i18n/getDictionary";

const ICONS = [SlidersHorizontal, Sparkles, TrendingUp, ShieldCheck, Kanban, Printer];

export async function Features() {
  const { features: t } = (await getServerDictionary()).landing;
  return (
    <section id="fonctionnalites" className="bg-surface border-y border-line">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-20 sm:py-28">
        <Reveal>
          <div className="flex items-center gap-2.5 mb-3 justify-center">
            <span className="w-[22px] h-0.5 bg-accent rounded-full" />
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </div>
          <h2 className="font-display text-[36px] sm:text-[46px] font-extrabold tracking-[-0.015em] text-ink text-center mb-16 text-balance">
            {t.title}
          </h2>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
          {t.items.map((f, i) => {
            const Icon = ICONS[i];
            return (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <div className="flex gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-[10px] bg-accent-soft flex items-center justify-center">
                    <Icon size={20} className="text-accent-deep" />
                  </div>
                  <div>
                    <h3 className="font-sans text-[15.5px] font-semibold text-ink mb-1.5">{f.title}</h3>
                    <p className="text-[13.5px] text-ink-soft leading-relaxed">{f.text}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
