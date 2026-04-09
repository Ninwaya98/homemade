-- =====================================================================
-- Authentic Kitchen — open up profile reads for marketplace flow
-- =====================================================================
-- The original "profiles: self read" policy was too restrictive for a
-- marketplace: customers couldn't see cook names while browsing, and
-- cooks couldn't see customer names on their order detail pages. This
-- migration replaces it with a set of narrower, intentional policies.
-- =====================================================================

drop policy if exists "profiles: self read" on public.profiles;

-- 1. Self read (own profile, all columns)
create policy "profiles: self read"
  on public.profiles for select
  using (id = auth.uid());

-- 2. Public read for approved cooks — needed for the customer browse
--    feed. Allows anon and authenticated customers to see any profile
--    whose owner is an approved cook.
create policy "profiles: public read approved cooks"
  on public.profiles for select
  using (
    exists (
      select 1 from public.cook_profiles
      where cook_profiles.id = profiles.id
        and cook_profiles.status = 'approved'
    )
  );

-- 3. Order participants read — when an order exists between two users,
--    each side can see the other's profile (for pickup/delivery
--    coordination, surfacing customer name on cook's order screen, etc).
create policy "profiles: order participants read"
  on public.profiles for select
  using (
    exists (
      select 1 from public.orders
      where (
            (orders.customer_id = profiles.id and orders.cook_id = auth.uid())
         or (orders.cook_id     = profiles.id and orders.customer_id = auth.uid())
      )
    )
  );

-- 4. Reviewers/reviewees can read each other's profile (for showing
--    reviewer name on the cook's public profile page).
create policy "profiles: review participants read"
  on public.profiles for select
  using (
    exists (
      select 1 from public.reviews
      where (
            (reviews.reviewer_id = profiles.id and reviews.reviewee_id = auth.uid())
         or (reviews.reviewee_id = profiles.id and reviews.reviewer_id = auth.uid())
         or (reviews.reviewer_id = profiles.id and exists (
               select 1 from public.cook_profiles
               where cook_profiles.id = reviews.reviewee_id
                 and cook_profiles.status = 'approved'
             ))
      )
    )
  );

-- (admin policy "profiles: admin all" from migration 001 still applies)
