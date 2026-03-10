-- Create evidence-files storage bucket
insert into storage.buckets (id, name, public)
values ('evidence-files', 'evidence-files', true)
on conflict (id) do nothing;

-- Storage RLS: allow authenticated users to upload to their project folders
create policy "Authenticated users can upload evidence"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'evidence-files'
    and auth.uid() is not null
  );

create policy "Public can read evidence files"
  on storage.objects for select
  to public
  using (bucket_id = 'evidence-files');

create policy "Users can delete their own evidence files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'evidence-files'
    and owner = auth.uid()
  );
