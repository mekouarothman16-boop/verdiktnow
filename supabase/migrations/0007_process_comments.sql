-- CADRAN — commentaires sur un processus.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : avec le rôle "lecteur" (0006), un membre peut consulter un processus sans
-- pouvoir le modifier. Les commentaires lui donnent un moyen d'apporter une contribution
-- (question, remarque, validation) sans toucher au diagnostic ou au ROI — d'où une policy
-- d'insertion basée sur can_access_process (accès en lecture), pas can_edit_process.

create table if not exists public.process_comments (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists process_comments_process_id_idx
  on public.process_comments (process_id, created_at);

alter table public.process_comments enable row level security;

-- Suppression : l'auteur du commentaire ou le propriétaire de l'organisation (modération).
create or replace function public.is_process_org_owner(check_process_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.processes p
    join public.organization_members m on m.organization_id = p.organization_id
    where p.id = check_process_id and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

drop policy if exists "process_comments_select_org" on public.process_comments;
create policy "process_comments_select_org" on public.process_comments
  for select using (public.can_access_process(process_id));

drop policy if exists "process_comments_insert_org" on public.process_comments;
create policy "process_comments_insert_org" on public.process_comments
  for insert with check (public.can_access_process(process_id) and author_id = auth.uid());

drop policy if exists "process_comments_delete_own_or_owner" on public.process_comments;
create policy "process_comments_delete_own_or_owner" on public.process_comments
  for delete using (author_id = auth.uid() or public.is_process_org_owner(process_id));
