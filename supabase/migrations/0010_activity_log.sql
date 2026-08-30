-- CADRAN — journal d'activité au niveau organisation.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : avec plusieurs membres par organisation (owner/member/viewer), plus de
-- collaboration (commentaires, liens de partage, profils de pondération), il devient utile
-- de voir qui a fait quoi. Append-only, comme assessment_history / ai_usage_events —
-- l'insertion se fait via is_org_member (tout rôle génère de l'activité, y compris un
-- lecteur qui commente), mais rien ne peut être modifié ou effacé après coup.

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  process_id uuid references public.processes (id) on delete set null,
  actor_id uuid references auth.users (id),
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_org_created_idx on public.activity_log (organization_id, created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "activity_log_select_org" on public.activity_log;
create policy "activity_log_select_org" on public.activity_log
  for select using (public.is_org_member(organization_id));

drop policy if exists "activity_log_insert_org" on public.activity_log;
create policy "activity_log_insert_org" on public.activity_log
  for insert with check (public.is_org_member(organization_id));
