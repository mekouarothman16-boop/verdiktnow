-- CADRAN — marque blanche : logo de l'organisation affiché sur la couverture du rapport PDF.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : le rapport PDF est souvent transmis par le client à sa propre direction ; il doit
-- pouvoir porter la marque du client, pas seulement celle de CADRAN. Bucket public (l'affichage
-- du logo dans le PDF se fait via une URL directe, pas d'URL signée) — un seul logo par
-- organisation, remplacé à chaque nouveau téléversement.
--
-- Convention de chemin : {organization_id}/logo.{ext} — le premier segment (organization_id)
-- est vérifié directement par les policies via is_org_owner, sans jointure supplémentaire.

alter table public.organizations add column if not exists logo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-logos',
  'org-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "org_logos_select_public" on storage.objects;
create policy "org_logos_select_public" on storage.objects
  for select using (bucket_id = 'org-logos');

drop policy if exists "org_logos_insert_owner" on storage.objects;
create policy "org_logos_insert_owner" on storage.objects
  for insert with check (
    bucket_id = 'org-logos'
    and public.is_org_owner((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "org_logos_update_owner" on storage.objects;
create policy "org_logos_update_owner" on storage.objects
  for update using (
    bucket_id = 'org-logos'
    and public.is_org_owner((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "org_logos_delete_owner" on storage.objects;
create policy "org_logos_delete_owner" on storage.objects
  for delete using (
    bucket_id = 'org-logos'
    and public.is_org_owner((storage.foldername(name))[1]::uuid)
  );
