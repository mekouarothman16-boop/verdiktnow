-- CADRAN — assignation d'une étape de la feuille de route à un membre de l'organisation.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : jusqu'ici, une étape de feuille de route n'était liée à personne en particulier
-- (seulement des colonnes d'audit : done_by, due_date_set_by). Sans assignation, tous les membres
-- d'une organisation voient exactement la même liste, sans notion de "qui doit faire quoi".

alter table public.roadmap_progress add column if not exists assigned_to uuid references auth.users (id);
