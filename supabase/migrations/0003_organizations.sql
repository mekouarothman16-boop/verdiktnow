-- CADRAN — organisations multi-utilisateurs + facturation par palier (brief §7, Phase 2, révisé)
-- À exécuter dans l'éditeur SQL de votre projet Supabase (ou via `supabase db push`).
-- Remplace le modèle "1 compte = 1 abonnement" (profiles.plan / stripe_*) par des organisations
-- partagées entre plusieurs utilisateurs, avec facturation isolée dans une table à part
-- (aucun membre ordinaire ne doit pouvoir s'auto-attribuer un palier via une policy d'écriture).

-- ------------------------------------------------------------------
-- 1. Tables
-- ------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mon organisation',
  constants jsonb not null default '{"hoursPerFte": 1600, "magnitudeRef": 120000}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colonnes de facturation isolées : seul le client service-role (webhook Stripe) y écrit.
create table if not exists public.organization_billing (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'essentiel', 'croissance', 'entreprise')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  subscription_status text,
  ai_quota_override integer
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on public.organization_members (user_id);

-- Invitations matchées par e-mail à l'inscription (jamais par un organization_id fourni
-- par le client au signup — ça permettrait à n'importe qui de s'attribuer une org arbitraire).
create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  invited_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz
);

create index if not exists organization_invites_email_idx on public.organization_invites (lower(email));

-- Journal append-only ; le quota mensuel se calcule en comptant les lignes du mois courant.
create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_org_created_idx on public.ai_usage_events (organization_id, created_at);

-- ------------------------------------------------------------------
-- 2. processes.organization_id (nullable ici — backfillé plus bas ;
--    le passage à NOT NULL sera une migration 0004 séparée une fois
--    le zéro-orphelin confirmé en environnement réel)
-- ------------------------------------------------------------------

alter table public.processes add column if not exists organization_id uuid references public.organizations (id);

-- ------------------------------------------------------------------
-- 3. Fonctions d'aide RLS
--    SECURITY DEFINER est nécessaire (pas juste une option) : sans ça, la policy de
--    organization_members s'auto-référencerait en boucle via la RLS de sa propre table.
--    search_path est fixé pour éviter tout détournement par recherche de schéma.
-- ------------------------------------------------------------------

create or replace function public.is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = check_org_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_org_owner(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = check_org_id and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.can_access_process(check_process_id uuid)
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
    where p.id = check_process_id and m.user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------------
-- 4. Backfill : une organisation personnelle par profil existant
-- ------------------------------------------------------------------

do $$
declare
  r record;
  v_org_id uuid;
begin
  for r in
    select pr.id, au.email
    from public.profiles pr
    join auth.users au on au.id = pr.id
    where not exists (
      select 1 from public.organization_members om where om.user_id = pr.id
    )
  loop
    insert into public.organizations (name)
      values (coalesce(nullif(split_part(r.email, '@', 1), ''), 'Mon organisation'))
      returning id into v_org_id;

    insert into public.organization_billing (organization_id) values (v_org_id);

    insert into public.organization_members (organization_id, user_id, role)
      values (v_org_id, r.id, 'owner');

    update public.processes set organization_id = v_org_id
      where user_id = r.id and organization_id is null;
  end loop;
end $$;

-- Vérification manuelle recommandée après exécution :
--   select count(*) from public.processes where organization_id is null;
--   → doit retourner 0.

-- ------------------------------------------------------------------
-- 5. Colonnes de facturation retirées de profiles (déplacées vers organization_billing)
-- ------------------------------------------------------------------

alter table public.profiles
  drop column if exists plan,
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id,
  drop column if exists subscription_status,
  drop column if exists constants;

-- ------------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_billing enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;
alter table public.ai_usage_events enable row level security;

drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select" on public.organizations
  for select using (public.is_org_member(id));

-- Seul name/constants sont modifiables par un owner ; aucune colonne de facturation
-- n'existe sur cette table, donc pas de risque d'auto-attribution de palier ici.
drop policy if exists "organizations_update_owner" on public.organizations;
create policy "organizations_update_owner" on public.organizations
  for update using (public.is_org_owner(id)) with check (public.is_org_owner(id));

-- Lecture seule pour les membres ; aucune policy d'écriture pour "authenticated" —
-- seul le client service-role (webhook Stripe) peut modifier cette table.
drop policy if exists "billing_select_members" on public.organization_billing;
create policy "billing_select_members" on public.organization_billing
  for select using (public.is_org_member(organization_id));

drop policy if exists "members_select_own_org" on public.organization_members;
create policy "members_select_own_org" on public.organization_members
  for select using (public.is_org_member(organization_id));

drop policy if exists "members_owner_delete" on public.organization_members;
create policy "members_owner_delete" on public.organization_members
  for delete using (public.is_org_owner(organization_id));

drop policy if exists "invites_owner_manage" on public.organization_invites;
create policy "invites_owner_manage" on public.organization_invites
  for all using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));

-- select + insert seulement : pas de update/delete, sinon un membre pourrait effacer
-- son propre historique d'usage pour contourner le quota mensuel.
drop policy if exists "ai_usage_select" on public.ai_usage_events;
create policy "ai_usage_select" on public.ai_usage_events
  for select using (public.is_org_member(organization_id));

drop policy if exists "ai_usage_insert" on public.ai_usage_events;
create policy "ai_usage_insert" on public.ai_usage_events
  for insert with check (public.is_org_member(organization_id));

-- processes / assessments / roi_inputs : remplace les anciennes policies mono-utilisateur
-- (auth.uid() = user_id) par une visibilité au niveau de l'organisation.

drop policy if exists "processes_all_own" on public.processes;
drop policy if exists "processes_all_org" on public.processes;
create policy "processes_all_org" on public.processes
  for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

drop policy if exists "assessments_all_own" on public.assessments;
drop policy if exists "assessments_all_org" on public.assessments;
create policy "assessments_all_org" on public.assessments
  for all using (public.can_access_process(process_id)) with check (public.can_access_process(process_id));

drop policy if exists "roi_inputs_all_own" on public.roi_inputs;
drop policy if exists "roi_inputs_all_org" on public.roi_inputs;
create policy "roi_inputs_all_org" on public.roi_inputs
  for all using (public.can_access_process(process_id)) with check (public.can_access_process(process_id));

-- ------------------------------------------------------------------
-- 7. Trigger de création de compte (réécrit) — rattache un nouvel utilisateur à
--    l'organisation qui l'a invité (matché par e-mail, jamais par une valeur fournie
--    par le client au signup), sinon lui crée une organisation personnelle.
--    Le corps est protégé par exception when others : un souci de provisionnement
--    d'organisation ne doit jamais empêcher la création du compte auth.users.
-- ------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_invite record;
  v_org_id uuid;
begin
  insert into public.profiles (id) values (new.id);

  select * into v_invite
    from public.organization_invites
    where lower(email) = lower(new.email)
      and accepted_at is null
      and expires_at > now()
    order by created_at desc
    limit 1;

  if v_invite.id is not null then
    insert into public.organization_members (organization_id, user_id, role)
      values (v_invite.organization_id, new.id, v_invite.role)
      on conflict (organization_id, user_id) do nothing;
    update public.organization_invites set accepted_at = now() where id = v_invite.id;
  else
    insert into public.organizations (name)
      values (coalesce(nullif(split_part(new.email, '@', 1), ''), 'Mon organisation'))
      returning id into v_org_id;
    insert into public.organization_billing (organization_id) values (v_org_id);
    insert into public.organization_members (organization_id, user_id, role)
      values (v_org_id, new.id, 'owner');
  end if;

  return new;
exception
  when others then
    raise warning 'handle_new_user org bootstrap failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Le trigger on_auth_user_created (0001_init.sql) pointe déjà vers cette fonction ;
-- aucune modification du trigger lui-même n'est nécessaire, seulement de la fonction.

-- ------------------------------------------------------------------
-- 8. updated_at auto-maintenu sur organizations
-- ------------------------------------------------------------------

drop trigger if exists set_updated_at on public.organizations;
create trigger set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
