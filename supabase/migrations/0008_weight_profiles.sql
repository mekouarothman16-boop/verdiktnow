-- CADRAN — profils de pondération réutilisables.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : ajuster les 6 leviers à chaque nouveau processus est répétitif quand
-- plusieurs processus du même type (ex. tous les processus "Finance & comptabilité")
-- partagent la même pondération type. Cette table permet de sauvegarder une pondération
-- au niveau organisation et de la réappliquer en un clic sur un futur processus.

create table if not exists public.weight_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  category text,
  weights jsonb not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists weight_profiles_org_idx on public.weight_profiles (organization_id, created_at desc);

alter table public.weight_profiles enable row level security;

-- Lecture ouverte à tout membre (y compris viewer, cohérent avec le reste du modèle).
drop policy if exists "weight_profiles_select_org" on public.weight_profiles;
create policy "weight_profiles_select_org" on public.weight_profiles
  for select using (public.is_org_member(organization_id));

-- Écriture réservée aux rôles éditeurs (owner/member) — un lecteur ne modifie rien.
drop policy if exists "weight_profiles_insert_org" on public.weight_profiles;
create policy "weight_profiles_insert_org" on public.weight_profiles
  for insert with check (public.is_org_editor(organization_id));

drop policy if exists "weight_profiles_delete_org" on public.weight_profiles;
create policy "weight_profiles_delete_org" on public.weight_profiles
  for delete using (public.is_org_editor(organization_id));
