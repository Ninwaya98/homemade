-- =====================================================================
-- Migration 016: admin_audit_log
-- =====================================================================
-- Append-only record of every meaningful change an admin makes: seller
-- approvals, profile edits, product CRUD, order status forces, review
-- moderation. Lets you see WHO changed WHAT and WHEN.
--
-- Writes happen from the admin server actions via a Supabase insert.
-- No update / delete policies — the log is immutable once written.
-- =====================================================================

create table public.admin_audit_log (
  id                uuid primary key default gen_random_uuid(),
  admin_id          uuid not null references public.profiles(id) on delete set null,
  action            text not null,        -- e.g. 'seller.approve', 'product.update', 'order.set_status'
  target_table      text not null,        -- e.g. 'seller_profiles', 'products', 'orders', 'reviews'
  target_id         uuid,                 -- id of the row acted on (nullable for future batch ops)
  target_seller_id  uuid references public.seller_profiles(id) on delete set null,
                                          -- denormalised so you can filter the log for one shop quickly
  old_values        jsonb,                -- snapshot before (optional)
  new_values        jsonb,                -- snapshot after (optional)
  notes             text,                 -- free-form admin note (optional)
  created_at        timestamptz not null default now()
);

create index admin_audit_log_admin_idx
  on public.admin_audit_log (admin_id, created_at desc);

create index admin_audit_log_target_idx
  on public.admin_audit_log (target_table, target_id, created_at desc);

create index admin_audit_log_seller_idx
  on public.admin_audit_log (target_seller_id, created_at desc)
  where target_seller_id is not null;

create index admin_audit_log_action_idx
  on public.admin_audit_log (action, created_at desc);

alter table public.admin_audit_log enable row level security;

-- Only admins can read the log.
create policy "audit: admin read"
  on public.admin_audit_log
  for select
  using (public.is_admin());

-- Only admins can insert, and only rows tagged with their own auth.uid.
-- No update / delete policies — the log is append-only.
create policy "audit: admin self insert"
  on public.admin_audit_log
  for insert
  with check (public.is_admin() and admin_id = auth.uid());
