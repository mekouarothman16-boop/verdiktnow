-- CADRAN — ajoute "Annulé" au statut de la feuille de route, et "À faire" comme valeur par défaut.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : le champ État (0024) n'avait que 3 valeurs (vert/jaune/rouge, affichées comme
-- Terminée/En cours/À faire) et restait vide tant que personne ne le touchait. On ajoute un 4e état
-- ("gray" → Annulé) et on fait de "red" (À faire) la valeur par défaut, y compris pour les lignes
-- déjà existantes qui n'avaient jamais été touchées.

alter table public.roadmap_progress drop constraint if exists roadmap_progress_status_color_check;
alter table public.roadmap_progress add constraint roadmap_progress_status_color_check
  check (status_color in ('red', 'yellow', 'green', 'gray'));

update public.roadmap_progress set status_color = 'red' where status_color is null;
alter table public.roadmap_progress alter column status_color set default 'red';
