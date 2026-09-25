-- =====================================================================
-- HomeMade: security hardening
-- =====================================================================
-- Closes the holes found in the Sep 2026 audit. Row-level policies
-- decide WHICH rows a user may write; they cannot limit WHICH columns.
-- The guard triggers below do that. They only apply to direct writes
-- from the `authenticated` / `anon` roles by non-admins, so SECURITY
-- DEFINER functions (score trigger, order RPC) keep working.
-- =====================================================================

create or replace function public.is_end_user()
returns boolean
language sql
stable
as $$
  select current_user in ('authenticated', 'anon') and not public.is_admin();
$$;

-- ---------------------------------------------------------------------
-- 1. Sign-up can no longer choose a role. Everyone starts as customer.
-- ---------------------------------------------------------------------
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
    'customer'
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Users cannot change their own role.
-- ---------------------------------------------------------------------
create or replace function public.guard_profiles_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_end_user() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profiles_update on public.profiles;
create trigger trg_guard_profiles_update
  before update on public.profiles
  for each row execute function public.guard_profiles_update();

-- ---------------------------------------------------------------------
-- 3. Sellers cannot approve themselves or edit their own scores.
-- ---------------------------------------------------------------------
create or replace function public.guard_seller_profiles_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.is_end_user() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status         := 'pending';
    new.avg_rating     := 0;
    new.rating_count   := 0;
    new.like_count     := 0;
    new.dislike_count  := 0;
    new.resolved_count := 0;
    new.score          := null;
    new.approved_at    := null;
    new.approved_by    := null;
  else
    new.status         := old.status;
    new.avg_rating     := old.avg_rating;
    new.rating_count   := old.rating_count;
    new.like_count     := old.like_count;
    new.dislike_count  := old.dislike_count;
    new.resolved_count := old.resolved_count;
    new.score          := old.score;
    new.approved_at    := old.approved_at;
    new.approved_by    := old.approved_by;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_seller_profiles_write on public.seller_profiles;
create trigger trg_guard_seller_profiles_write
  before insert or update on public.seller_profiles
  for each row execute function public.guard_seller_profiles_write();

-- ---------------------------------------------------------------------
-- 4. Orders: only created through place_product_order; commission and
--    payout computed in the database; direct updates limited.
-- ---------------------------------------------------------------------
drop policy if exists "orders: customer creates own" on public.orders;

drop function if exists public.place_product_order(
  uuid, integer, public.order_type, integer, integer, integer, text
);

create or replace function public.place_product_order(
  p_product_id  uuid,
  p_quantity    integer,
  p_type        public.order_type,
  p_total_cents integer,
  p_notes       text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product        public.products%rowtype;
  v_customer       uuid := auth.uid();
  v_order_id       uuid;
  v_expected_total integer;
  v_commission     integer;
begin
  if v_customer is null then
    raise exception 'not authenticated';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then
    raise exception 'quantity must be between 1 and 20';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception 'product not found';
  end if;
  if v_product.status <> 'active' then
    raise exception 'product is not available';
  end if;
  if v_customer = v_product.seller_id then
    raise exception 'cannot purchase your own product';
  end if;

  v_expected_total := v_product.price_cents * p_quantity;
  if p_total_cents is distinct from v_expected_total then
    raise exception 'price mismatch: the price has changed, please reload';
  end if;

  if not exists (
    select 1 from public.seller_profiles
    where id = v_product.seller_id and status = 'approved'
  ) then
    raise exception 'seller is not approved';
  end if;

  if v_product.stock_quantity < p_quantity then
    raise exception 'not enough stock available';
  end if;

  update public.products
    set stock_quantity = stock_quantity - p_quantity,
        status = case when stock_quantity - p_quantity <= 0
                      then 'out_of_stock'::public.product_status
                      else status end
    where id = p_product_id;

  -- Same 16% rate as PLATFORM_COMMISSION_RATE in src/lib/constants/pricing.ts
  v_commission := round(v_expected_total * 0.16);

  insert into public.orders (
    customer_id, seller_id, product_id, quantity,
    total_cents, commission_cents, cook_payout_cents,
    type, status, vertical, notes
  ) values (
    v_customer, v_product.seller_id, p_product_id, p_quantity,
    v_expected_total, v_commission, v_expected_total - v_commission,
    p_type, 'pending', 'market', p_notes
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

-- Order status transitions (mirrors src/lib/order-utils.ts):
--   customer: pending -> cancelled, and may set delivery_address
--   seller:   pending -> confirmed|cancelled, confirmed -> ready|cancelled,
--             ready -> completed
-- Money, parties, product and quantity never change outside admin.
create or replace function public.guard_orders_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not public.is_end_user() then
    return new;
  end if;

  if new.customer_id       is distinct from old.customer_id
  or new.seller_id         is distinct from old.seller_id
  or new.cook_id           is distinct from old.cook_id
  or new.product_id        is distinct from old.product_id
  or new.dish_id           is distinct from old.dish_id
  or new.quantity          is distinct from old.quantity
  or new.total_cents       is distinct from old.total_cents
  or new.commission_cents  is distinct from old.commission_cents
  or new.cook_payout_cents is distinct from old.cook_payout_cents
  or new.vertical          is distinct from old.vertical
  or new.type              is distinct from old.type then
    raise exception 'this order field cannot be changed';
  end if;

  if new.status is distinct from old.status then
    if v_uid = old.seller_id then
      if not (
           (old.status = 'pending'   and new.status in ('confirmed', 'cancelled'))
        or (old.status = 'confirmed' and new.status in ('ready', 'cancelled'))
        or (old.status = 'ready'     and new.status = 'completed')
      ) then
        raise exception 'order status change not allowed';
      end if;
    elsif v_uid = old.customer_id then
      if not (old.status = 'pending' and new.status = 'cancelled') then
        raise exception 'order status change not allowed';
      end if;
    else
      raise exception 'order status change not allowed';
    end if;
  end if;

  if new.delivery_address is distinct from old.delivery_address
     and v_uid is distinct from old.customer_id then
    raise exception 'only the customer can change the delivery address';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_orders_update on public.orders;
create trigger trg_guard_orders_update
  before update on public.orders
  for each row execute function public.guard_orders_update();

-- Atomic stock restore for a cancelled market order. Callable by the
-- order's customer, its seller, or an admin; only once per order.
alter table public.orders add column if not exists stock_restored boolean not null default false;

create or replace function public.restock_cancelled_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  update public.orders
    set stock_restored = true
    where id = p_order_id
      and status = 'cancelled'
      and vertical = 'market'
      and stock_restored = false
      and product_id is not null
      and (auth.uid() in (customer_id, seller_id) or public.is_admin())
    returning * into v_order;

  if not found then
    return;
  end if;

  update public.products
    set stock_quantity = stock_quantity + v_order.quantity,
        status = case when status = 'out_of_stock'
                      then 'active'::public.product_status
                      else status end
    where id = v_order.product_id;
end;
$$;

revoke execute on function public.restock_cancelled_order(uuid) from public, anon;
grant execute on function public.restock_cancelled_order(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Reviews: reviewers edit their words, reviewees add a response.
-- ---------------------------------------------------------------------
create or replace function public.guard_reviews_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not public.is_end_user() then
    return new;
  end if;

  if new.order_id    is distinct from old.order_id
  or new.reviewer_id is distinct from old.reviewer_id
  or new.reviewee_id is distinct from old.reviewee_id
  or new.role        is distinct from old.role
  or new.resolved_at is distinct from old.resolved_at
  or new.resolved_by is distinct from old.resolved_by
  or new.ai_sentiment is distinct from old.ai_sentiment
  or new.ai_summary   is distinct from old.ai_summary then
    raise exception 'this review field cannot be changed';
  end if;

  if v_uid = old.reviewer_id then
    if new.response_text is distinct from old.response_text
    or new.response_at   is distinct from old.response_at then
      raise exception 'reviewers cannot write the response';
    end if;
    if new.resolution_status is distinct from old.resolution_status
       and new.resolution_status <> 'none' then
      raise exception 'reviewers cannot resolve reviews';
    end if;
  elsif v_uid = old.reviewee_id then
    if new.sentiment is distinct from old.sentiment
    or new.rating    is distinct from old.rating
    or new.text      is distinct from old.text then
      raise exception 'only the reviewer can change the review';
    end if;
    if new.resolution_status is distinct from old.resolution_status
       and new.resolution_status <> 'pending' then
      raise exception 'reviewees can only request a review';
    end if;
  else
    raise exception 'not allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_reviews_update on public.reviews;
create trigger trg_guard_reviews_update
  before update on public.reviews
  for each row execute function public.guard_reviews_update();

-- ---------------------------------------------------------------------
-- 6. Nobody can push notifications into another user's bell.
-- ---------------------------------------------------------------------
revoke execute on function public.create_notification from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. Sellers can see the customer on their own orders.
-- ---------------------------------------------------------------------
drop policy if exists "profiles: order participants read" on public.profiles;
create policy "profiles: order participants read"
  on public.profiles for select
  using (
    exists (
      select 1 from public.orders
      where (orders.customer_id = profiles.id and auth.uid() in (orders.cook_id, orders.seller_id))
         or (profiles.id in (orders.cook_id, orders.seller_id) and orders.customer_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 8. Users can delete their own account.
-- ---------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
