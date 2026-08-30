-- CADRAN — champs de tableau de bord de gestion de projet pour la feuille de route.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : la feuille de route passe d'une simple liste à cocher à une vue tableau de bord
-- (Action, Description, Responsable, Début, Fin, % avancement, Bloquant, État). Le Responsable
-- et l'échéance existent déjà (assigned_to, due_date) ; ceci ajoute le reste.

alter table public.roadmap_progress add column if not exists title text;
alter table public.roadmap_progress add column if not exists start_date date;
alter table public.roadmap_progress add column if not exists progress_percent smallint not null default 0 check (progress_percent between 0 and 100);
alter table public.roadmap_progress add column if not exists is_blocking boolean not null default false;
alter table public.roadmap_progress add column if not exists status_color text check (status_color in ('green', 'yellow', 'red'));
