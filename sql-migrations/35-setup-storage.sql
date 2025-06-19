-- Create a storage bucket for file uploads
insert into storage.buckets (id, name, public)
values ('files', 'files', true)
on conflict (name) do nothing;

-- Set up access controls for the bucket
create policy "Public Access"
on storage.objects for select
using (bucket_id = 'files');

create policy "Users can upload files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'files');

create policy "Users can update their own files"
on storage.objects for update
to authenticated
using (auth.uid() = owner);

create policy "Users can delete their own files"
on storage.objects for delete
to authenticated
using (auth.uid() = owner);

-- Create a function to check if a user has access to a file
create or replace function can_access_file(file_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from files
    where id = file_id
    and (
      created_by = auth.uid()
      or exists (
        select 1 from contacts
        where id = files.contact_id
        and created_by = auth.uid()
      )
    )
  );
$$;

-- Grant necessary permissions
grant select, insert, update, delete on storage.objects to authenticated;
grant execute on function can_access_file to authenticated;
