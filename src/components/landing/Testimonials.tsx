import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { GUTTER, INSET, MEASURE, SHELL } from "./layout";
import { tintWash } from "./tint";
import { getServerDictionary } from "@/i18n/getDictionary";

// Conteneur contourné enveloppant des cartes teintées, repris de tonnect.io.
//
// Les citations sont de vrais retours d'utilisateurs, fournis par le fondateur
// et corrigés uniquement pour les fautes de frappe. Ne jamais y substituer de
// texte inventé : cette section est de la preuve sociale, et une citation
// fabriquée trompe des gens qui prennent une décision d'achat.
//
// Seul endroit de la page où le lavis est employé à pleine intensité. Le reste
// des sections utilise les échelles « section » et « card » de tintWash, plus
// discrètes : c'est cet écart qui fait de cette section un point d'arrêt.
const TINTS = ["clay", "sky", "sand"] as const;

export async function Testimonials() {
  const { testimonials: t } = (await getServerDictionary()).landing;
  return (
    <section className={`${GUTTER} py-6 sm:py-8`}>
      <div className={`${SHELL} ${INSET} py-16 sm:py-24`}>
        <Reveal>
          <div className="flex items-center gap-2.5 mb-3 justify-center">
            <span className="w-[22px] h-0.5 bg-accent rounded-full" />
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </div>
          <h2 className="font-display text-[36px] sm:text-[46px] font-semibold tracking-[0.005em] text-ink text-center mb-4 text-balance">
            {t.title}
          </h2>
          <p className={`text-ink-soft text-[15.5px] leading-relaxed text-center ${MEASURE} mb-14`}>
            {t.subtitle}
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-[40px] border border-ink/15 p-4">
            <div className="grid md:grid-cols-3 gap-4">
              {t.quotes.map((q, i) => (
                <figure
                  key={i}
                  className="flex flex-col rounded-[32px] bg-surface p-8"
                  style={tintWash(TINTS[i % TINTS.length], "feature")}
                >
                  <blockquote className="text-[16px] text-ink leading-[1.5] flex-1">
                    {q.quote}
                  </blockquote>
                  <figcaption className="mt-8">
                    <div className="font-display text-[15px] font-semibold text-ink">{q.author}</div>
                    <div className="text-[13px] text-ink-soft mt-0.5">{q.role}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
