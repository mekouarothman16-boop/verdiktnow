-- CADRAN — choix mensuel / annuel pour l'abonnement d'une organisation.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : Stripe exige que tous les items d'un même abonnement partagent le même
-- intervalle de facturation — impossible de mélanger un item mensuel (palier de base) et un
-- item annuel (siège Spectateur) sur le même abonnement. Cette colonne mémorise l'intervalle
-- choisi par l'organisation, déduit de l'abonnement Stripe réel par le webhook, pour que
-- syncSeatBilling() (src/lib/supabase/seatBilling.ts) sache quelle variante de prix (mensuelle
-- ou annuelle) utiliser pour chaque type de siège.

alter table public.organization_billing
  add column if not exists billing_period text not null default 'monthly'
  check (billing_period in ('monthly', 'annual'));
