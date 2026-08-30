-- CADRAN — suivi coché de la feuille de route (roadmap actionnable).
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : jusqu'ici la feuille de route générée par buildRoadmap() (src/lib/pdf/roadmap.ts)
-- n'existait que comme texte statique dans le PDF exporté. Cette table permet de cocher
-- chaque étape directement dans l'outil et de retrouver cet état à la prochaine visite.
-- `step_key` est l'identifiant stable retourné par buildRoadmap (ex. "sponsorConfirm",
-- "leverPrep-std") — stable même quand le texte affiché change (score, noms interpolés),
-- donc ne casse pas quand la feuille de route est régénérée après une nouvelle sauvegarde.

create table if not exists public.roadmap_progress (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes (id) on delete cascade,
  step_key text not null,
  done boolean not null default false,
  done_by uuid references auth.users (id),
  done_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (process_id, step_key)
);

create index if not exists roadmap_progress_process_id_idx
  on public.roadmap_progress (process_id);

alter table public.roadmap_progress enable row level security;

-- Lecture : tout membre ayant accès au processus (même principe que comments/second_opinions).
drop policy if exists "roadmap_progress_select_org" on public.roadmap_progress;
create policy "roadmap_progress_select_org" on public.roadmap_progress
  for select using (public.can_access_process(process_id));

-- Écriture : réservée aux rôles éditeurs (owner/member) — un lecteur ne coche rien,
-- même règle que pour assessments/roi_inputs (0006_readonly_role.sql).
drop policy if exists "roadmap_progress_insert_org" on public.roadmap_progress;
create policy "roadmap_progress_insert_org" on public.roadmap_progress
  for insert with check (public.can_edit_process(process_id));

drop policy if exists "roadmap_progress_update_org" on public.roadmap_progress;
create policy "roadmap_progress_update_org" on public.roadmap_progress
  for update using (public.can_edit_process(process_id)) with check (public.can_edit_process(process_id));

drop policy if exists "roadmap_progress_delete_org" on public.roadmap_progress;
create policy "roadmap_progress_delete_org" on public.roadmap_progress
  for delete using (public.can_edit_process(process_id));
