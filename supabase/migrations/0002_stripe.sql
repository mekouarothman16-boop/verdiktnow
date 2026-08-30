-- CADRAN — abonnements Stripe (brief §7, Phase 2)
-- À exécuter dans l'éditeur SQL de votre projet Supabase (ou via `supabase db push`).

alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text;

create index if not exists profiles_stripe_customer_id_idx on public.profiles (stripe_customer_id);

-- Le webhook Stripe écrit dans cette table via la clé de service (contourne RLS) ;
-- aucune policy supplémentaire n'est nécessaire ici.
