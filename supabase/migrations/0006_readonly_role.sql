-- CADRAN — rôle "lecteur" (accès en lecture seule à une organisation).
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : jusqu'ici tout membre d'une organisation (owner ou member) a les mêmes droits
-- d'écriture sur les processus (policy "for all" sur processes/assessments/roi_inputs).
-- Pour partager un dossier avec un client ou un intervenant externe sans risquer une
-- modification accidentelle, on ajoute un rôle "viewer" : accès en lecture identique,
-- mais aucune écriture — appliqué au niveau RLS, pas seulement côté interface.

alter table public.organization_members drop constraint if exists organization_members_role_check;
alter table public.organization_members add constraint organization_members_role_check
  check (role in ('owner', 'member', 'viewer'));

alter table public.organization_invites drop constraint if exists organization_invites_role_check;
alter table public.organization_invites add constraint organization_invites_role_check
  check (role in ('owner', 'member', 'viewer'));

-- ------------------------------------------------------------------
-- Fonctions d'aide RLS (mêmes conventions que is_org_member / can_access_process
-- dans 0003_organizations.sql : SECURITY DEFINER + search_path fixé).
-- ------------------------------------------------------------------

create or replace function public.is_org_editor(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = check_org_id and user_id = auth.uid() and role in ('owner', 'member')
  );
$$;

create or replace function public.can_edit_process(check_process_id uuid)
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
    where p.id = check_process_id and m.user_id = auth.uid() and m.role in ('owner', 'member')
  );
$$;

-- ------------------------------------------------------------------
-- processes : remplace la policy "for all" unique par une lecture ouverte à tout
-- membre (y compris viewer) et une écriture réservée aux rôles owner/member.
-- ------------------------------------------------------------------

drop policy if exists "processes_all_org" on public.processes;

drop policy if exists "processes_select_org" on public.processes;
create policy "processes_select_org" on public.processes
  for select using (public.is_org_member(organization_id));

drop policy if exists "processes_insert_org" on public.processes;
create policy "processes_insert_org" on public.processes
  for insert with check (public.is_org_editor(organization_id));

drop policy if exists "processes_update_org" on public.processes;
create policy "processes_update_org" on public.processes
  for update using (public.is_org_editor(organization_id)) with check (public.is_org_editor(organization_id));

drop policy if exists "processes_delete_org" on public.processes;
create policy "processes_delete_org" on public.processes
  for delete using (public.is_org_editor(organization_id));

-- ------------------------------------------------------------------
-- assessments : même bascule select ouverte / écriture réservée.
-- ------------------------------------------------------------------

drop policy if exists "assessments_all_org" on public.assessments;

drop policy if exists "assessments_select_org" on public.assessments;
create policy "assessments_select_org" on public.assessments
  for select using (public.can_access_process(process_id));

drop policy if exists "assessments_insert_org" on public.assessments;
create policy "assessments_insert_org" on public.assessments
  for insert with check (public.can_edit_process(process_id));

drop policy if exists "assessments_update_org" on public.assessments;
create policy "assessments_update_org" on public.assessments
  for update using (public.can_edit_process(process_id)) with check (public.can_edit_process(process_id));

drop policy if exists "assessments_delete_org" on public.assessments;
create policy "assessments_delete_org" on public.assessments
  for delete using (public.can_edit_process(process_id));

-- ------------------------------------------------------------------
-- roi_inputs : idem.
-- ------------------------------------------------------------------

drop policy if exists "roi_inputs_all_org" on public.roi_inputs;

drop policy if exists "roi_inputs_select_org" on public.roi_inputs;
create policy "roi_inputs_select_org" on public.roi_inputs
  for select using (public.can_access_process(process_id));

drop policy if exists "roi_inputs_insert_org" on public.roi_inputs;
create policy "roi_inputs_insert_org" on public.roi_inputs
  for insert with check (public.can_edit_process(process_id));

drop policy if exists "roi_inputs_update_org" on public.roi_inputs;
create policy "roi_inputs_update_org" on public.roi_inputs
  for update using (public.can_edit_process(process_id)) with check (public.can_edit_process(process_id));

drop policy if exists "roi_inputs_delete_org" on public.roi_inputs;
create policy "roi_inputs_delete_org" on public.roi_inputs
  for delete using (public.can_edit_process(process_id));

-- ------------------------------------------------------------------
-- assessment_history : lecture inchangée (un viewer peut consulter l'évolution),
-- mais l'insertion (déclenchée par une sauvegarde) requiert désormais un rôle éditeur.
-- ------------------------------------------------------------------

drop policy if exists "assessment_history_insert_org" on public.assessment_history;
create policy "assessment_history_insert_org" on public.assessment_history
  for insert with check (public.can_edit_process(process_id));
