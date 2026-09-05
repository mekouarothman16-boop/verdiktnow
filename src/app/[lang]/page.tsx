import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { ToolShowcase } from "@/components/landing/ToolShowcase";
import { StatsBar } from "@/components/landing/StatsBar";
import { Risks } from "@/components/landing/Risks";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Methodology } from "@/components/landing/Methodology";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getServerDictionary } from "@/i18n/getDictionary";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ compte_supprime?: string }>;
}) {
  const user = isSupabaseConfigured
    ? (await (await createClient()).auth.getUser()).data.user
    : null;
  const { compte_supprime } = await searchParams;
  const { home: t } = (await getServerDictionary()).landing;

  return (
    <>
      <LandingNav loggedIn={!!user} />
      <main className="flex-1">
        {compte_supprime === "1" && (
          <div className="max-w-[1160px] mx-auto px-5 sm:px-6 pt-6">
            <div className="px-4 py-3 rounded-[12px] bg-teal/10 border border-teal/20 text-[13px] text-teal">
              {t.accountDeleted}
            </div>
          </div>
        )}
        {/* L'ordre des sections est une chaîne de questions : chaque section se
            termine sur celle que la suivante va traiter. C'est ce qui retient un
            visiteur sur onze écrans, davantage que la qualité de chacune.

              hero          comment savoir lequel ?
              statistiques  pourquoi ça échoue, alors ?
              risques       montrez-moi cette matrice
              vitrine       comment j'y arrive ?
              parcours      ce score est-il sérieux ?
              méthode       et ensuite, je fais quoi ?
              fonctions     ça marche pour d'autres ?
              témoignages   combien ça coûte ?
              forfaits      j'ai des questions
              faq           d'accord

            La vitrine produit vient après les risques et non avant, parce que la
            deuxième paire de risques annonce « une matrice Valeur × Aptitude qui
            tranche » et que la vitrine la montre. Séparées, les deux se lisent
            comme une redondance ; collées, comme une preuve. */}
        <Hero />
        <StatsBar />
        <Risks />
        <ToolShowcase />
        <HowItWorks />
        <Methodology />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
