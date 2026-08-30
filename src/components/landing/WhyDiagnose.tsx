import { TriangleAlert, Wallet, BarChart3 } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { getServerDictionary } from "@/i18n/getDictionary";

const ICONS = [TriangleAlert, Wallet, BarChart3];

export async function WhyDiagnose() {
  const { whyDiagnose: t } = (await getServerDictionary()).landing;
  return (
    <section className="bg-surface border-y border-line">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-20 sm:py-28">
        <Reveal>
          <div className="flex items-center gap-2.5 mb-3 justify-center">
            <span className="w-[22px] h-0.5 bg-accent rounded-full" />
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </div>
          <h2 className="font-display text-[36px] sm:text-[46px] font-extrabold tracking-[-0.015em] text-ink text-center mb-4 text-balance">
            {t.title}
          </h2>
          <p className="text-ink-soft text-[15.5px] leading-relaxed text-center max-w-[640px] mx-auto mb-16">
            {t.intro}
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-[0.9fr_1fr] gap-6 mb-14 items-stretch">
          {(() => {
            const [lead, ...rest] = t.reasons;
            const LeadIcon = ICONS[0];
            return (
              <>
                <Reveal>
                  <div className="h-full flex flex-col bg-accent-soft/50 border border-accent/20 rounded-xl p-8 shadow-card hover:shadow-card-lg transition-shadow duration-300">
                    <div className="flex items-start gap-5 mb-5">
                      <div className="w-12 h-12 shrink-0 rounded-[10px] bg-white border border-accent/20 flex items-center justify-center">
                        <LeadIcon size={22} className="text-accent-deep" />
                      </div>
                      <div>
                        <h3 className="font-display text-[21px] font-bold text-ink mb-2">{lead.title}</h3>
                        <p className="text-[14.5px] text-ink-soft leading-relaxed">{lead.text}</p>
                      </div>
                    </div>
                    <div className="mt-auto pt-5 border-t border-accent/15">
                      <p className="text-[13px] text-ink-soft leading-relaxed">
                        <span className="text-accent-deep font-semibold">Ex. </span>
                        {lead.example}
                      </p>
                    </div>
                  </div>
                </Reveal>

                <div className="grid gap-6">
                  {rest.map((r, i) => {
                    const Icon = ICONS[i + 1];
                    return (
                      <Reveal key={r.title} delay={(i + 1) * 0.1}>
                        <div className="h-full flex items-start gap-5 bg-bg border border-line rounded-xl p-6 shadow-card hover:shadow-card-lg transition-shadow duration-300">
                          <div className="w-11 h-11 shrink-0 rounded-[10px] bg-accent-soft flex items-center justify-center">
                            <Icon size={20} className="text-accent-deep" />
                          </div>
                          <div>
                            <h3 className="font-sans text-[16px] font-semibold text-ink mb-2">{r.title}</h3>
                            <p className="text-[13.5px] text-ink-soft leading-relaxed mb-3">{r.text}</p>
                            <p className="text-[12.5px] text-ink-faint leading-relaxed">
                              <span className="text-accent-deep font-semibold">Ex. </span>
                              {r.example}
                            </p>
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>

        <Reveal delay={0.2}>
          <div className="max-w-[820px] mx-auto text-center">
            <Eyebrow className="mb-4">{t.signalsLabel}</Eyebrow>
            <div className="flex flex-wrap justify-center gap-2.5">
              {t.signals.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg border border-line text-[12.5px] text-ink-soft font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
