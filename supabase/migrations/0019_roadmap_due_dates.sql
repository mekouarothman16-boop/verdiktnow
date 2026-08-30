-- CADRAN — échéances sur les étapes de la feuille de route.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : chaque étape (générée ou personnalisée) peut maintenant recevoir une date cible,
-- affichée en rouge dans l'outil si elle est dépassée et que l'étape n'est pas cochée. Un simple
-- champ date, pas d'heure ni de fuseau — cohérent avec la granularité "jour" de tout le reste de
-- la feuille de route (phases exprimées en semaines/mois).

alter table public.roadmap_progress add column if not exists due_date date;
