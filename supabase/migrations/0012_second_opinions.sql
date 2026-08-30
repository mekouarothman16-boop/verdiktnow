-- CADRAN — deuxièmes avis (triangulation multi-répondant sur le diagnostic d'aptitude).
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : l'évaluation principale est une auto-évaluation à un seul répondant — la
-- confiance de l'évaluation plafonne à "Moyenne" pour cette raison. Un deuxième avis
-- indépendant, soumis par un autre membre de l'organisation (y compris un lecteur), permet
-- de vérifier si les évaluations convergent et, si oui, de justifier une confiance "Élevée".
-- Ce n'est jamais une modification de l'évaluation principale (assessments) : c'est une
-- réponse indépendante, propre à chaque répondant.

create table if not exists public.assessment_second_opinions (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes (id) on delete cascade,
  respondent_id uuid not null references auth.users (id),
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (process_id, respondent_id)
);

create index if not exists assessment_second_opinions_process_id_idx
  on public.assessment_second_opinions (process_id);

alter table public.assessment_second_opinions enable row level security;

-- Lecture : tout membre ayant accès au processus (même principe que les commentaires).
drop policy if exists "second_opinions_select_org" on public.assessment_second_opinions;
create policy "second_opinions_select_org" on public.assessment_second_opinions
  for select using (public.can_access_process(process_id));

-- Écriture : chacun ne peut créer/modifier/supprimer que son propre deuxième avis.
drop policy if exists "second_opinions_insert_own" on public.assessment_second_opinions;
create policy "second_opinions_insert_own" on public.assessment_second_opinions
  for insert with check (public.can_access_process(process_id) and respondent_id = auth.uid());

drop policy if exists "second_opinions_update_own" on public.assessment_second_opinions;
create policy "second_opinions_update_own" on public.assessment_second_opinions
  for update using (respondent_id = auth.uid()) with check (respondent_id = auth.uid());

drop policy if exists "second_opinions_delete_own" on public.assessment_second_opinions;
create policy "second_opinions_delete_own" on public.assessment_second_opinions
  for delete using (respondent_id = auth.uid());
