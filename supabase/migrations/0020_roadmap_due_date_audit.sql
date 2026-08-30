-- CADRAN — traçabilité de qui a fixé l'échéance d'une étape de la feuille de route.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : cocher une étape enregistre déjà qui l'a fait (done_by/done_at, 0017). Une échéance
-- fixée doit être consignée de la même façon — pas seulement la date elle-même, mais qui l'a fixée,
-- pour qu'un engagement pris par un membre de l'équipe reste traçable pour les autres.

alter table public.roadmap_progress add column if not exists due_date_set_by uuid references auth.users (id);
