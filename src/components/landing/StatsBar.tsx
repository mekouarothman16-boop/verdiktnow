import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { getServerDictionary } from "@/i18n/getDictionary";

export async function StatsBar() {
  const { stats: t } = (await getServerDictionary()).landing;
  return (
    <section className="max-w-[1160px] mx-auto px-5 sm:px-6 py-16 sm:py-20">
      <Reveal>
        <div className="flex items-center gap-2.5 mb-3 justify-center">
          <span className="w-[22px] h-0.5 bg-accent rounded-full" />
          <Eyebrow>{t.eyebrow}</Eyebrow>
        </div>
        <h2 className="font-display text-[30px] sm:text-[38px] font-extrabold tracking-[-0.015em] text-ink text-center mb-14 text-balance">
          {t.title}
        </h2>
      </Reveal>

      <div className="grid sm:grid-cols-3 gap-6">
        {t.items.map((s, i) => (
          <Reveal key={s.value} delay={i * 0.1}>
            <div className="h-full flex flex-col bg-surface border border-line rounded-xl p-7 shadow-card hover:shadow-card-lg hover:-translate-y-1 transition duration-300">
              <div className="font-display text-[44px] sm:text-[50px] font-extrabold tracking-[-0.02em] text-accent leading-none mb-3">
                {s.value}
              </div>
              <p className="text-[13.5px] text-ink-soft leading-relaxed mb-5">{s.text}</p>
              <div className="mt-auto pt-5 border-t border-line-soft">
                <p className="text-[13px] text-ink font-medium leading-relaxed">
                  <span className="text-accent">→</span> {s.response}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
