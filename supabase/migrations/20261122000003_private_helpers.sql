-- Keep security-definer helpers out of the exposed API schema.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.is_admin() set schema private;
alter function public.contact_rate_ok(text) set schema private;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;
revoke all on function private.contact_rate_ok(text) from public;
grant execute on function private.contact_rate_ok(text) to anon, authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- guard_profile_role referenced public.is_admin() by name; recreate it.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and not private.is_admin() then
    raise exception 'Only an administrator can change roles';
  end if;
  return new;
end $$;
revoke all on function public.guard_profile_role() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
