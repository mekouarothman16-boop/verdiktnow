-- CADRAN — pièces jointes de contexte (captures d'écran, exemples de documents).
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : une image d'un formulaire ou d'un document source en dit souvent plus qu'un
-- paragraphe de description. Bucket privé (pas d'accès public direct) — la consultation se
-- fait via une URL signée à durée limitée, générée à la demande.
--
-- Convention de chemin : {organization_id}/{process_id}/{fichier} — le premier segment
-- (organization_id) est vérifié directement par les policies via is_org_member/is_org_editor,
-- sans jointure supplémentaire.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'process-attachments',
  'process-attachments',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "process_attachments_select_org" on storage.objects;
create policy "process_attachments_select_org" on storage.objects
  for select using (
    bucket_id = 'process-attachments'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "process_attachments_insert_org" on storage.objects;
create policy "process_attachments_insert_org" on storage.objects
  for insert with check (
    bucket_id = 'process-attachments'
    and public.is_org_editor((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "process_attachments_delete_org" on storage.objects;
create policy "process_attachments_delete_org" on storage.objects
  for delete using (
    bucket_id = 'process-attachments'
    and public.is_org_editor((storage.foldername(name))[1]::uuid)
  );
