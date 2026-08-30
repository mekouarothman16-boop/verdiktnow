-- CADRAN — liens de partage en lecture seule.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : permettre de partager un processus (diagnostic, ROI, priorisation) avec un
-- client ou un intervenant externe sans compte CADRAN. La consultation publique se fait
-- via une route qui interroge cette table avec le client service-role (contourne RLS
-- volontairement, scopée au seul process_id du token demandé) — ces policies RLS ne
-- couvrent donc que la gestion des liens par les membres de l'organisation, pas la lecture
-- publique elle-même.
--
-- La création est réservée aux rôles éditeurs (owner/member) : un lecteur ne doit pas
-- pouvoir faire fuiter un processus vers l'extérieur.

create table if not exists public.process_share_links (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes (id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists process_share_links_token_idx on public.process_share_links (token);
create index if not exists process_share_links_process_idx on public.process_share_links (process_id);

alter table public.process_share_links enable row level security;

drop policy if exists "process_share_links_select_org" on public.process_share_links;
create policy "process_share_links_select_org" on public.process_share_links
  for select using (public.can_edit_process(process_id));

drop policy if exists "process_share_links_insert_org" on public.process_share_links;
create policy "process_share_links_insert_org" on public.process_share_links
  for insert with check (public.can_edit_process(process_id) and created_by = auth.uid());

drop policy if exists "process_share_links_update_org" on public.process_share_links;
create policy "process_share_links_update_org" on public.process_share_links
  for update using (public.can_edit_process(process_id)) with check (public.can_edit_process(process_id));
