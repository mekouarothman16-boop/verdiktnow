import { ScanSearch, Calculator, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { Reveal } from "./Reveal";
import { getServerDictionary } from "@/i18n/getDictionary";

const ICONS = [ScanSearch, Calculator, LayoutGrid, SlidersHorizontal];

export async function Promises() {
  const { promises: t } = (await getServerDictionary()).landing;
  return (
    <section className="relative bg-ink overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full blur-3xl opacity-20"
        style={{ background: "var(--color-accent)" }}
      />
      <div className="relative max-w-[1160px] mx-auto px-5 sm:px-6 py-20 sm:py-28">
        <Reveal>
          <div className="flex items-center gap-2.5 mb-3 justify-center">
            <span className="w-[22px] h-0.5 bg-gold-tint rounded-full" />
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-gold-tint font-medium">
              {t.eyebrow}
            </span>
          </div>
          <h2 className="font-display text-[36px] sm:text-[46px] font-extrabold tracking-[-0.015em] text-white text-center mb-16 text-balance">
            {t.title}
          </h2>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-12 max-w-[880px] mx-auto">
          {t.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <Reveal key={item.title} delay={i * 0.08}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-[10px] bg-white/5 border border-gold-tint/30 flex items-center justify-center">
                    <Icon size={19} className="text-gold-tint" />
                  </div>
                  <div>
                    <h3 className="font-display text-[17px] font-bold text-white mb-1.5">{item.title}</h3>
                    <p className="text-[13.5px] text-white/60 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.3}>
          <div className="mt-16 pt-10 border-t border-white/10 max-w-[720px] mx-auto text-center">
            <p className="text-[13px] text-white/55 leading-relaxed max-w-[520px] mx-auto mb-8">
              {t.costIntro}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
              <div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/40 mb-2">
                  {t.costVendorLabel}
                </div>
                <div className="font-display text-[26px] sm:text-[30px] font-extrabold text-white/70 line-through decoration-white/30">
                  {t.costVendorValue}
                </div>
              </div>
              <div className="font-display text-[15px] font-bold text-gold-tint shrink-0">vs</div>
              <div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold-tint mb-2">
                  {t.costCadranLabel}
                </div>
                <div className="font-display text-[26px] sm:text-[30px] font-extrabold text-white">
                  {t.costCadranValue}
                </div>
              </div>
            </div>
            <p className="text-[10.5px] text-white/35 mt-6 leading-relaxed">{t.costSource}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
