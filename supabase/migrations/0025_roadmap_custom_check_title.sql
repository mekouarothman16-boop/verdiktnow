-- CADRAN — corrige la contrainte des étapes personnalisées après l'introduction de `title`.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : la contrainte de 0018 exigeait `text` (obligatoire) pour une étape personnalisée.
-- Depuis le tableau de bord (0024), le formulaire rapide "+ Ajouter une action" écrit maintenant
-- le nom court dans `title`, `text` (description) devenant optionnel — la contrainte doit suivre.

alter table public.roadmap_progress drop constraint if exists roadmap_progress_custom_check;
alter table public.roadmap_progress add constraint roadmap_progress_custom_check
  check (not is_custom or (title is not null and phase_key is not null));
