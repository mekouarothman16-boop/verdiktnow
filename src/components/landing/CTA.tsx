import Image from "next/image";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { getServerDictionary } from "@/i18n/getDictionary";

export async function CTA() {
  const { cta: t } = (await getServerDictionary()).landing;
  return (
    <section className="max-w-[1160px] mx-auto px-5 sm:px-6 pb-20 sm:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-accent-deep px-8 py-16 sm:px-16 sm:py-20 text-center">
          <Image
            src="/generated/cta-texture.png"
            alt=""
            fill
            sizes="(min-width: 1160px) 1160px, 100vw"
            className="object-cover opacity-50 mix-blend-soft-light animate-bg-drift"
          />
          <h2 className="relative font-display text-[34px] sm:text-[44px] font-extrabold tracking-[-0.015em] text-white mb-4 text-balance">
            {t.title}
          </h2>
          <p className="relative text-white/70 text-[15.5px] leading-relaxed max-w-[480px] mx-auto mb-9">
            {t.subtitle}
          </p>
          <LocaleLink
            href="/inscription"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-accent-vivid text-ink text-[15px] font-semibold hover:brightness-95 transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
          >
            {t.button} <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </LocaleLink>
        </div>
      </Reveal>
    </section>
  );
}
