-- CADRAN — archivage des processus + étiquettes libres.
-- À exécuter dans l'éditeur SQL de votre projet Supabase (ou via `supabase db push`).
--
-- Contexte : "Supprimer" effaçait un processus (et, depuis la migration 0004, tout son
-- historique) de façon irréversible. On introduit l'archivage comme action par défaut ;
-- la suppression définitive reste possible mais seulement depuis la vue des archives.
-- Les étiquettes libres complètent les 9 catégories fixes pour organiser le portefeuille
-- selon des critères propres à l'organisation.

alter table public.processes add column if not exists archived_at timestamptz;
alter table public.processes add column if not exists tags text[] not null default '{}';

create index if not exists processes_tags_idx on public.processes using gin (tags);
create index if not exists processes_archived_at_idx on public.processes (archived_at);
