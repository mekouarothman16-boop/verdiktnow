import Image from "next/image";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { GUTTER, SHELL } from "./layout";
import { getServerDictionary } from "@/i18n/getDictionary";

export async function CTA() {
  const { cta: t } = (await getServerDictionary()).landing;
  return (
    <section className={`${GUTTER} pb-20 sm:pb-28`}>
      {/* Le bloc vient au bord de la coque, comme les cartes encadrées : même
          axe vertical que le reste de la page.

          Il est en chartreuse plein, seul endroit du site où la couleur de
          marque occupe une grande surface. Le système s'appelle « Le Feu Vert »
          et le chartreuse ne couvrait jusqu'ici qu'un quart de pour cent de la
          page, réparti sur des boutons : la promesse n'était jamais montrée.
          Ici elle l'est, à l'endroit exact où on demande au visiteur d'y aller.
          Conforme à la règle Fill-Not-Text : remplissage plein, texte `ink`
          dessus, jamais l'inverse. */}
      <div className={SHELL}>
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] bg-accent-vivid px-8 py-16 sm:px-16 sm:py-20 text-center">
            <Image
              src="/generated/cta-texture.png"
              alt=""
              fill
              sizes="(min-width: 1320px) 1320px, 100vw"
              className="object-cover opacity-25 mix-blend-soft-light animate-bg-drift"
            />
            <h2 className="relative font-display text-[34px] sm:text-[44px] font-semibold tracking-[0.005em] text-ink mb-4 text-balance">
              {t.title}
            </h2>
            <p className="relative text-ink/70 text-[15.5px] leading-relaxed max-w-[480px] mx-auto mb-9">
              {t.subtitle}
            </p>
            {/* Le bouton s'inverse : sur un aplat chartreuse, un bouton
                chartreuse disparaîtrait. */}
            <LocaleLink
              href="/inscription"
              className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-ink text-white text-[16px] font-semibold hover:brightness-125 transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
            >
              {t.button} <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </LocaleLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
