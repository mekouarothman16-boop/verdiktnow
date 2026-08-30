-- CADRAN — modification et ajout d'étapes sur la feuille de route.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : jusqu'ici roadmap_progress (0017) ne stockait qu'un booléen "coché" par étape
-- générée. On ajoute la possibilité de personnaliser une feuille de route : réécrire le texte
-- d'une action proposée (`text` sert alors de surcharge affichée à la place du texte généré),
-- ou ajouter une action entièrement propre à l'équipe (`is_custom = true`, `text` obligatoire,
-- `phase_key` indique où l'afficher : "immediate", "phase-0", "phase-1" ou "phase-2" — un index
-- plutôt que le titre de la phase, qui est traduit et donc pas stable d'une langue à l'autre).
--
-- Pour une étape personnalisée, `step_key` n'a pas de sens sémantique (contrairement aux clés
-- générées comme "sponsorConfirm") : la valeur par défaut ci-dessous laisse Postgres en générer
-- une, cohérent avec le token des liens de partage (0009) généré côté DB plutôt que par le client.

alter table public.roadmap_progress alter column step_key set default (gen_random_uuid()::text);
alter table public.roadmap_progress add column if not exists text text;
alter table public.roadmap_progress add column if not exists is_custom boolean not null default false;
alter table public.roadmap_progress add column if not exists phase_key text;

alter table public.roadmap_progress drop constraint if exists roadmap_progress_custom_check;
alter table public.roadmap_progress add constraint roadmap_progress_custom_check
  check (not is_custom or (text is not null and phase_key is not null));
