-- Drop and recreate the trigger to ensure it works correctly
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user_org();

-- Recreate with proper search_path for security definer functions
create or replace function handle_new_user_org()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  org_id uuid;
  org_name text;
begin
  org_name := coalesce(
    new.raw_user_meta_data->>'org_name',
    split_part(new.email, '@', 1) || '''s Organization'
  );

  insert into public.organizations (name, owner_id)
  values (org_name, new.id)
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user_org();
