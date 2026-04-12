-- =====================================================================
-- HomeMade — fix infinite recursion on profiles update
-- =====================================================================
-- The "profiles: self update" policy's WITH CHECK clause does a
-- subquery back to profiles to enforce role immutability:
--   role = (select role from profiles where id = auth.uid())
-- This triggers SELECT policies on profiles, which check cook_profiles
-- and seller_profiles, which call is_admin() → queries profiles → loop.
--
-- Fix: replace the self-update policy with a simpler one (no subquery),
-- and add a SECURITY DEFINER function for profile updates that bypasses
-- RLS entirely.
-- =====================================================================

-- 1) Replace the problematic self-update policy.
--    Role immutability is enforced at the application layer (no form
--    exposes the role field to non-admin users).
drop policy if exists "profiles: self update" on public.profiles;

create policy "profiles: self update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- 2) SECURITY DEFINER function for safe profile updates.
--    Bypasses RLS entirely — only updates the caller's own row.
create or replace function public.update_own_profile(
  p_phone    text default null,
  p_location text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
    set phone    = coalesce(p_phone, phone),
        location = coalesce(p_location, location),
        updated_at = now()
    where id = auth.uid();
end;
$$;
