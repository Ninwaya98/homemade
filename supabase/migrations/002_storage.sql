-- =====================================================================
-- Authentic Kitchen — storage buckets + RLS
-- =====================================================================
-- Three buckets:
--   cook-photos   public  — cook avatars (browseable)
--   dish-photos   public  — dish photos (browseable)
--   certificates  PRIVATE — food handler certificates (admin + owner)
-- File path convention: <cook_id>/<filename>
-- Owner-uploads-to-own-folder is enforced via the path's first segment
-- equalling the authenticated user's id.
-- =====================================================================

-- ---------- Buckets ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cook-photos',  'cook-photos',  true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('dish-photos',  'dish-photos',  true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('certificates', 'certificates', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- Helper: extract first path segment as a uuid ----------
-- storage.foldername returns text[] of path components.
-- objects are stored at <user_id>/<filename>, so foldername[1] = user_id.

-- ---------- Public READ policies for the two public buckets ----------
-- (Buckets are marked public, but objects still need an explicit policy.)
drop policy if exists "cook-photos read" on storage.objects;
create policy "cook-photos read"
  on storage.objects for select
  using (bucket_id = 'cook-photos');

drop policy if exists "dish-photos read" on storage.objects;
create policy "dish-photos read"
  on storage.objects for select
  using (bucket_id = 'dish-photos');

-- ---------- Certificates: only the owning cook + admins can read ----------
drop policy if exists "certificates owner read" on storage.objects;
create policy "certificates owner read"
  on storage.objects for select
  using (
    bucket_id = 'certificates'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- ---------- Upload: authenticated users may upload to their own folder ----------
-- Same rule for all 3 buckets — first path segment must equal auth.uid().
drop policy if exists "own folder upload" on storage.objects;
create policy "own folder upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('cook-photos','dish-photos','certificates')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- Update: same rule, only own folder ----------
drop policy if exists "own folder update" on storage.objects;
create policy "own folder update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('cook-photos','dish-photos','certificates')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('cook-photos','dish-photos','certificates')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- Delete: same rule, only own folder ----------
drop policy if exists "own folder delete" on storage.objects;
create policy "own folder delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('cook-photos','dish-photos','certificates')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
