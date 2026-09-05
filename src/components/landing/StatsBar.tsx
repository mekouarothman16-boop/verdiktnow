import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { GUTTER, INSET, SHELL } from "./layout";
import { CountUpValue } from "./CountUpValue";
import { getServerDictionary } from "@/i18n/getDictionary";

// Le moment typographique de la page.
//
// Ces trois chiffres étaient dans des cartes, à 50 px, comme le reste : la page
// n'avait aucun écart d'échelle d'un bout à l'autre, et c'est l'absence d'écart
// qui la rendait plate. Ici le chrome de carte disparaît, les chiffres montent
// à 88 px et ne sont plus séparés que par un filet. Rien n'est perdu du
// contenu : c'est le seul endroit de la page où la typographie parle plus fort
// que la mise en boîte.
export async function StatsBar() {
  const { stats: t } = (await getServerDictionary()).landing;
  return (
    <section className={`${GUTTER} py-20 sm:py-28`}>
      <div className={`${SHELL} ${INSET}`}>
        <Reveal>
          <div className="flex items-center gap-2.5 mb-3 justify-center">
            <span className="w-[22px] h-0.5 bg-accent rounded-full" />
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </div>
          <h2 className="font-display text-[30px] sm:text-[38px] font-semibold tracking-[0.005em] text-ink text-center mb-16 text-balance">
            {t.title}
          </h2>
        </Reveal>

        <div className="grid sm:grid-cols-3 gap-y-14">
          {t.items.map((s, i) => (
            <Reveal
              key={s.value}
              delay={i * 0.1}
              className="sm:px-8 sm:first:pl-0 sm:last:pr-0 sm:border-l sm:first:border-l-0 border-line"
            >
              <div className="font-display text-[64px] sm:text-[88px] font-extrabold tracking-[-0.03em] text-accent leading-[0.92] mb-5">
                <CountUpValue value={s.value} />
              </div>
              <p className="text-[14px] text-ink-soft leading-relaxed mb-5">{s.text}</p>
              <p className="text-[13px] text-ink font-medium leading-relaxed">
                <span className="text-accent">→</span> {s.response}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
