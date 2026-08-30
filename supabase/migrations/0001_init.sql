-- CADRAN — schéma initial (brief §6)
-- À exécuter dans l'éditeur SQL de votre projet Supabase (ou via `supabase db push`).

-- ------------------------------------------------------------------
-- profiles — un profil par utilisateur authentifié
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  constants jsonb not null default '{"hoursPerFte": 1600, "magnitudeRef": 120000}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Crée automatiquement un profil (plan gratuit) à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------
-- processes — un processus évalué, propriété d'un utilisateur
-- ------------------------------------------------------------------
create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Processus sans titre',
  currency text not null default 'CAD' check (currency in ('CAD', 'MAD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.processes enable row level security;

create policy "processes_all_own" on public.processes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists processes_user_id_idx on public.processes (user_id);

-- ------------------------------------------------------------------
-- assessments — diagnostic d'aptitude (1:1 avec un processus)
-- ------------------------------------------------------------------
create table if not exists public.assessments (
  process_id uuid primary key references public.processes (id) on delete cascade,
  context jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  weights jsonb not null default '{}'::jsonb,
  aptitude_score integer,
  ai_analysis jsonb,
  updated_at timestamptz not null default now()
);

alter table public.assessments enable row level security;

create policy "assessments_all_own" on public.assessments
  for all using (
    auth.uid() = (select user_id from public.processes where id = process_id)
  )
  with check (
    auth.uid() = (select user_id from public.processes where id = process_id)
  );

-- ------------------------------------------------------------------
-- roi_inputs — dossier d'affaires (1:1 avec un processus)
-- ------------------------------------------------------------------
create table if not exists public.roi_inputs (
  process_id uuid primary key references public.processes (id) on delete cascade,
  inputs jsonb not null default '{}'::jsonb,
  value_score integer,
  updated_at timestamptz not null default now()
);

alter table public.roi_inputs enable row level security;

create policy "roi_inputs_all_own" on public.roi_inputs
  for all using (
    auth.uid() = (select user_id from public.processes where id = process_id)
  )
  with check (
    auth.uid() = (select user_id from public.processes where id = process_id)
  );

-- ------------------------------------------------------------------
-- updated_at auto-maintenu
-- ------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.processes;
create trigger set_updated_at before update on public.processes
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.assessments;
create trigger set_updated_at before update on public.assessments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.roi_inputs;
create trigger set_updated_at before update on public.roi_inputs
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
