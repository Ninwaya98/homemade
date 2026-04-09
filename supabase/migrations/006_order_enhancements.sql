-- =====================================================================
-- Authentic Kitchen — order flow enhancements
-- =====================================================================

-- 1) Add delivery address for delivery orders
alter table public.orders
  add column if not exists delivery_address text;

-- 2) Add status transition timestamps
alter table public.orders
  add column if not exists confirmed_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

-- 3) Add estimated ready time (cook sets this when confirming)
alter table public.orders
  add column if not exists estimated_ready_time text;
