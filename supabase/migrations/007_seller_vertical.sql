-- =====================================================================
-- HomeMade — seller vertical (handmade goods marketplace)
-- =====================================================================

-- ---------- New enums ----------
alter type public.user_role add value 'seller';

create type public.seller_status as enum ('pending', 'approved', 'suspended');
create type public.product_status as enum ('active', 'paused', 'out_of_stock');
create type public.product_category as enum (
  'crafts_art',
  'clothing_accessories',
  'home_decor',
  'food_products'
);
create type public.order_vertical as enum ('kitchen', 'market');

-- ---------- Seller profiles ----------
create table public.seller_profiles (
  id                  uuid primary key references public.profiles(id) on delete cascade,
  shop_name           text not null,
  shop_description    text,
  category            public.product_category not null,
  photo_url           text,
  status              public.seller_status not null default 'pending',
  avg_rating          numeric(3,2) not null default 0.00,
  rating_count        integer not null default 0,
  approved_at         timestamptz,
  approved_by         uuid references public.profiles(id),
  last_active_at      timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index seller_profiles_status_idx on public.seller_profiles (status);
create index seller_profiles_category_idx on public.seller_profiles (category);
create index seller_profiles_last_active_idx on public.seller_profiles (last_active_at);

-- ---------- Products ----------
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references public.seller_profiles(id) on delete cascade,
  name            text not null,
  description     text,
  category        public.product_category not null,
  subcategory     text,
  price_cents     integer not null check (price_cents >= 0),
  stock_quantity  integer not null default 0 check (stock_quantity >= 0),
  materials       text,
  dimensions      text,
  condition       text not null default 'handmade',
  photo_urls      text[] not null default '{}',
  ingredients     text,  -- only relevant for food_products category
  status          public.product_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index products_seller_id_idx on public.products (seller_id);
create index products_status_idx on public.products (status);
create index products_category_idx on public.products (category);

-- ---------- Extend orders for multi-vertical ----------
alter table public.orders
  add column if not exists vertical public.order_vertical not null default 'kitchen';

alter table public.orders
  add column if not exists seller_id uuid references public.seller_profiles(id) on delete restrict;

alter table public.orders
  add column if not exists product_id uuid references public.products(id) on delete restrict;

-- Make cook_id and dish_id nullable (market orders don't have these)
alter table public.orders alter column cook_id drop not null;
alter table public.orders alter column dish_id drop not null;

-- Ensure data integrity: kitchen orders need cook+dish, market orders need seller+product
alter table public.orders add constraint orders_vertical_check check (
  (vertical = 'kitchen' and cook_id is not null and dish_id is not null)
  or (vertical = 'market' and seller_id is not null and product_id is not null)
);

-- ---------- Extend payouts for sellers ----------
alter table public.payouts alter column cook_id drop not null;
alter table public.payouts
  add column if not exists seller_id uuid references public.seller_profiles(id) on delete cascade;
alter table public.payouts add constraint payouts_owner_check check (
  cook_id is not null or seller_id is not null
);

-- ---------- Extend review_role for sellers ----------
alter type public.review_role add value 'seller';

-- ---------- Storage: product photos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-photos',
  'product-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ---------- RLS: seller_profiles ----------
alter table public.seller_profiles enable row level security;

create policy "seller_profiles: public read approved"
  on public.seller_profiles for select
  using (status = 'approved' or id = auth.uid() or public.is_admin());

create policy "seller_profiles: seller self insert"
  on public.seller_profiles for insert
  with check (id = auth.uid());

create policy "seller_profiles: seller self update"
  on public.seller_profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "seller_profiles: admin all"
  on public.seller_profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- RLS: products ----------
alter table public.products enable row level security;

create policy "products: public read from approved sellers"
  on public.products for select
  using (
    seller_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.seller_profiles
      where id = products.seller_id and status = 'approved'
    )
  );

create policy "products: seller manages own"
  on public.products for all
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "products: admin all"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- RLS: extend orders for sellers ----------
create policy "orders: seller sees own"
  on public.orders for select
  using (seller_id is not null and seller_id = auth.uid());

create policy "orders: seller updates own orders"
  on public.orders for update
  using (seller_id is not null and seller_id = auth.uid())
  with check (seller_id is not null and seller_id = auth.uid());

-- ---------- RLS: extend payouts for sellers ----------
create policy "payouts: seller reads own"
  on public.payouts for select
  using (seller_id is not null and seller_id = auth.uid());

-- ---------- RLS: product photos storage ----------
create policy "product-photos: public read"
  on storage.objects for select
  using (bucket_id = 'product-photos');

create policy "product-photos: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product-photos: owner update"
  on storage.objects for update
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product-photos: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- Profile visibility for approved sellers ----------
create policy "profiles: approved sellers public read"
  on public.profiles for select
  using (
    exists (
      select 1 from public.seller_profiles
      where seller_profiles.id = profiles.id
        and seller_profiles.status = 'approved'
    )
  );

-- ---------- place_product_order RPC ----------
create or replace function public.place_product_order(
  p_product_id       uuid,
  p_quantity          integer,
  p_type             public.order_type,
  p_total_cents      integer,
  p_commission_cents integer,
  p_seller_payout_cents integer,
  p_notes            text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product   public.products%rowtype;
  v_customer  uuid := auth.uid();
  v_order_id  uuid;
begin
  if v_customer is null then
    raise exception 'not authenticated';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'quantity must be at least 1';
  end if;

  -- Lock the product row for concurrency safety.
  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception 'product not found';
  end if;
  if v_product.status <> 'active' then
    raise exception 'product is not available';
  end if;

  -- Seller must be approved.
  if not exists (
    select 1 from public.seller_profiles
    where id = v_product.seller_id and status = 'approved'
  ) then
    raise exception 'seller is not approved';
  end if;

  -- Check stock.
  if v_product.stock_quantity < p_quantity then
    raise exception 'not enough stock available';
  end if;

  -- Decrement stock.
  update public.products
    set stock_quantity = stock_quantity - p_quantity
    where id = p_product_id;

  -- Auto-mark out_of_stock if depleted.
  if v_product.stock_quantity - p_quantity <= 0 then
    update public.products set status = 'out_of_stock' where id = p_product_id;
  end if;

  -- Insert the order.
  insert into public.orders (
    customer_id, seller_id, product_id, quantity,
    total_cents, commission_cents, cook_payout_cents,
    type, status, vertical, notes
  ) values (
    v_customer, v_product.seller_id, p_product_id, p_quantity,
    p_total_cents, p_commission_cents, p_seller_payout_cents,
    p_type, 'pending', 'market', p_notes
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

-- ---------- Seller health view ----------
create or replace view public.seller_health as
select
  sp.id,
  p.full_name,
  sp.shop_name,
  sp.status,
  sp.category,
  sp.avg_rating,
  sp.rating_count,
  sp.created_at,
  sp.last_active_at,
  ( select max(o.created_at) from public.orders o
      where o.seller_id = sp.id and o.vertical = 'market' ) as last_order_at,
  ( select count(*) from public.products pr
      where pr.seller_id = sp.id and pr.status = 'active' ) as active_products,
  ( select count(*) from public.orders o
      where o.seller_id = sp.id
        and o.vertical = 'market'
        and o.created_at > now() - interval '7 days' ) as orders_last_7d,
  case
    when sp.status <> 'approved' then sp.status::text
    when sp.approved_at is not null
      and sp.approved_at > now() - interval '7 days'
      then 'new'
    when (
      select max(o.created_at) from public.orders o
      where o.seller_id = sp.id and o.vertical = 'market'
    ) is null
    and sp.created_at < now() - interval '14 days'
      then 'inactive'
    when (
      select max(o.created_at) from public.orders o
      where o.seller_id = sp.id and o.vertical = 'market'
    ) < now() - interval '14 days'
      then 'inactive'
    when (
      select count(*) from public.products pr
      where pr.seller_id = sp.id and pr.status = 'active'
    ) = 0
      then 'no_products'
    when (
      select count(*) from public.orders o
      where o.seller_id = sp.id
        and o.vertical = 'market'
        and o.created_at > now() - interval '7 days'
    ) = 0
      then 'low_orders'
    else 'active'
  end as health_status
from public.seller_profiles sp
join public.profiles p on p.id = sp.id;

grant select on public.seller_health to authenticated;
