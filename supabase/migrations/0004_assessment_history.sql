-- CADRAN — historique des évaluations + base pour la détection de collision d'édition.
-- À exécuter dans l'éditeur SQL de votre projet Supabase (ou via `supabase db push`).
--
-- Contexte : jusqu'ici, chaque sauvegarde d'un processus écrase l'état précédent
-- (upsert sur assessments/roi_inputs) sans laisser de trace. La feuille de route générée
-- promet pourtant de "documenter l'évolution de l'aptitude et des gains" après réévaluation —
-- impossible sans historique. Cette table capture un instantané à chaque sauvegarde réussie.
-- assessments.updated_at (déjà auto-maintenu par le trigger set_updated_at) sert par ailleurs
-- de base à la détection de collision côté application : aucune colonne supplémentaire requise.

create table if not exists public.assessment_history (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes (id) on delete cascade,
  context jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  weights jsonb not null default '{}'::jsonb,
  aptitude_score integer,
  roi_inputs jsonb not null default '{}'::jsonb,
  value_score integer,
  net_recurring numeric,
  saved_by uuid references auth.users (id),
  saved_at timestamptz not null default now()
);

create index if not exists assessment_history_process_id_idx
  on public.assessment_history (process_id, saved_at desc);

alter table public.assessment_history enable row level security;

-- Append-only : select + insert seulement, comme ai_usage_events — un membre ne doit pas
-- pouvoir réécrire ou effacer l'historique d'un processus pour en falsifier l'évolution.
drop policy if exists "assessment_history_select_org" on public.assessment_history;
create policy "assessment_history_select_org" on public.assessment_history
  for select using (public.can_access_process(process_id));

drop policy if exists "assessment_history_insert_org" on public.assessment_history;
create policy "assessment_history_insert_org" on public.assessment_history
  for insert with check (public.can_access_process(process_id));
