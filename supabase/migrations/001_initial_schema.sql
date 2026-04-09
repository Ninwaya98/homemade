-- =====================================================================
-- Authentic Kitchen — initial schema
-- =====================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a
-- fresh project. It creates the public schema, RLS policies, and a
-- trigger that auto-creates a profile row whenever a user signs up.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type public.user_role as enum ('cook', 'customer', 'admin');
create type public.cook_status as enum ('pending', 'approved', 'suspended');
create type public.dish_status as enum ('active', 'paused', 'sold_out');
create type public.availability_mode as enum ('preorder', 'on_demand');
create type public.order_type as enum ('pickup', 'delivery');
create type public.order_status as enum (
  'pending',     -- payment captured, awaiting cook confirmation
  'confirmed',   -- cook accepted
  'ready',       -- cook marked ready for pickup/handoff
  'completed',   -- collected/delivered, eligible for review
  'cancelled'
);
create type public.review_role as enum ('customer', 'cook');
create type public.payout_status as enum ('pending', 'paid', 'failed');

-- ---------- Profiles ----------
-- One row per auth.users id. Holds the role and shared profile data.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.user_role not null default 'customer',
  full_name   text not null,
  phone       text,
  location    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up. The role and
-- full_name are passed via raw_user_meta_data on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'customer')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Cook profiles ----------
create table public.cook_profiles (
  id                  uuid primary key references public.profiles(id) on delete cascade,
  bio                 text,
  cuisine_tags        text[] not null default '{}',
  certification_url   text,
  status              public.cook_status not null default 'pending',
  avg_rating          numeric(3,2) not null default 0.00,
  rating_count        integer not null default 0,
  approved_at         timestamptz,
  approved_by         uuid references public.profiles(id),
  last_active_at      timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index cook_profiles_status_idx on public.cook_profiles (status);
create index cook_profiles_last_active_idx on public.cook_profiles (last_active_at);

-- ---------- Dishes ----------
create table public.dishes (
  id              uuid primary key default gen_random_uuid(),
  cook_id         uuid not null references public.cook_profiles(id) on delete cascade,
  name            text not null,
  description     text,
  photo_url       text,
  price_cents     integer not null check (price_cents >= 0),
  portion_size    text,
  -- Allergens are mandatory: an empty array means "explicitly none declared".
  -- The application enforces that this checklist must be completed.
  allergens       text[] not null default '{}',
  cuisine_tag     text,
  status          public.dish_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index dishes_cook_id_idx on public.dishes (cook_id);
create index dishes_status_idx on public.dishes (status);

-- ---------- Availability ----------
-- One row per cook per day they choose to open. Cap defaults to 6 portions
-- for new cooks (enforced at the application layer when creating).
create table public.availability (
  id                uuid primary key default gen_random_uuid(),
  cook_id           uuid not null references public.cook_profiles(id) on delete cascade,
  date              date not null,
  mode              public.availability_mode not null default 'preorder',
  max_portions      integer not null default 6 check (max_portions > 0),
  portions_taken    integer not null default 0 check (portions_taken >= 0),
  is_open           boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (cook_id, date)
);

create index availability_date_idx on public.availability (date);

-- ---------- Orders ----------
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.profiles(id) on delete restrict,
  cook_id           uuid not null references public.cook_profiles(id) on delete restrict,
  dish_id           uuid not null references public.dishes(id) on delete restrict,
  quantity          integer not null check (quantity > 0),
  total_cents       integer not null check (total_cents >= 0),
  commission_cents  integer not null check (commission_cents >= 0),
  cook_payout_cents integer not null check (cook_payout_cents >= 0),
  type              public.order_type not null,
  status            public.order_status not null default 'pending',
  scheduled_for     date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders (customer_id);
create index orders_cook_id_idx on public.orders (cook_id);
create index orders_status_idx on public.orders (status);

-- ---------- Reviews ----------
-- A row exists per (order_id, role) — one review from each side per order.
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  reviewer_id   uuid not null references public.profiles(id) on delete cascade,
  reviewee_id   uuid not null references public.profiles(id) on delete cascade,
  role          public.review_role not null,
  rating        smallint not null check (rating between 1 and 5),
  text          text,
  created_at    timestamptz not null default now(),
  unique (order_id, role)
);

create index reviews_reviewee_idx on public.reviews (reviewee_id);

-- ---------- Payouts ----------
create table public.payouts (
  id                  uuid primary key default gen_random_uuid(),
  cook_id             uuid not null references public.cook_profiles(id) on delete cascade,
  amount_cents        integer not null check (amount_cents >= 0),
  stripe_transfer_id  text,
  period_start        date not null,
  period_end          date not null,
  status              public.payout_status not null default 'pending',
  created_at          timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles        enable row level security;
alter table public.cook_profiles   enable row level security;
alter table public.dishes          enable row level security;
alter table public.availability    enable row level security;
alter table public.orders          enable row level security;
alter table public.reviews         enable row level security;
alter table public.payouts         enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- profiles policies ----------
create policy "profiles: self read"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: self update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
  -- Users cannot change their own role; admins go through the cook approval flow.

create policy "profiles: admin all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- cook_profiles policies ----------
-- Anyone signed in can read APPROVED cooks (for browsing).
create policy "cook_profiles: public read approved"
  on public.cook_profiles for select
  using (status = 'approved' or id = auth.uid() or public.is_admin());

create policy "cook_profiles: cook self insert"
  on public.cook_profiles for insert
  with check (id = auth.uid());

create policy "cook_profiles: cook self update"
  on public.cook_profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "cook_profiles: admin all"
  on public.cook_profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- dishes policies ----------
-- Customers only see dishes from APPROVED cooks. Cooks see/manage their own.
create policy "dishes: public read from approved cooks"
  on public.dishes for select
  using (
    cook_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.cook_profiles
      where id = dishes.cook_id and status = 'approved'
    )
  );

create policy "dishes: cook manages own"
  on public.dishes for all
  using (cook_id = auth.uid())
  with check (cook_id = auth.uid());

create policy "dishes: admin all"
  on public.dishes for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- availability policies ----------
create policy "availability: public read approved"
  on public.availability for select
  using (
    cook_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.cook_profiles
      where id = availability.cook_id and status = 'approved'
    )
  );

create policy "availability: cook manages own"
  on public.availability for all
  using (cook_id = auth.uid())
  with check (cook_id = auth.uid());

-- ---------- orders policies ----------
create policy "orders: customer sees own"
  on public.orders for select
  using (customer_id = auth.uid() or cook_id = auth.uid() or public.is_admin());

create policy "orders: customer creates own"
  on public.orders for insert
  with check (customer_id = auth.uid());

create policy "orders: cook updates own"
  on public.orders for update
  using (cook_id = auth.uid() or customer_id = auth.uid() or public.is_admin())
  with check (cook_id = auth.uid() or customer_id = auth.uid() or public.is_admin());

-- ---------- reviews policies ----------
create policy "reviews: public read"
  on public.reviews for select
  using (true);

-- Reviews can only be created for COMPLETED orders, by a participant.
create policy "reviews: participants insert on completed"
  on public.reviews for insert
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.orders
      where orders.id = reviews.order_id
        and orders.status = 'completed'
        and (orders.customer_id = auth.uid() or orders.cook_id = auth.uid())
    )
  );

-- ---------- payouts policies ----------
create policy "payouts: cook reads own"
  on public.payouts for select
  using (cook_id = auth.uid() or public.is_admin());

create policy "payouts: admin manages"
  on public.payouts for all
  using (public.is_admin())
  with check (public.is_admin());
