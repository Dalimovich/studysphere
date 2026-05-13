-- Align document upload buckets with current backend defaults and keep the
-- legacy course-documents bucket private if an environment still references it.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'course-uploads',
    'course-uploads',
    false,
    26214400,
    array[
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg'
    ]::text[]
  ),
  (
    'course-documents',
    'course-documents',
    false,
    26214400,
    array['application/pdf']::text[]
  )
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own course uploads" on storage.objects;
drop policy if exists "Users can upload their own course files" on storage.objects;
drop policy if exists "Users can update their own course uploads" on storage.objects;
drop policy if exists "Users can delete their own course uploads" on storage.objects;

create policy "Users can read their own course uploads"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('course-uploads', 'course-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload their own course files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('course-uploads', 'course-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    (bucket_id = 'course-documents' and lower(storage.extension(name)) = 'pdf')
    or
    (bucket_id = 'course-uploads' and lower(storage.extension(name)) in ('pdf', 'txt', 'docx', 'png', 'jpg', 'jpeg'))
  )
);

create policy "Users can update their own course uploads"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('course-uploads', 'course-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('course-uploads', 'course-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    (bucket_id = 'course-documents' and lower(storage.extension(name)) = 'pdf')
    or
    (bucket_id = 'course-uploads' and lower(storage.extension(name)) in ('pdf', 'txt', 'docx', 'png', 'jpg', 'jpeg'))
  )
);

create policy "Users can delete their own course uploads"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('course-uploads', 'course-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
