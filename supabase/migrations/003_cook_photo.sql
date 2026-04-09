-- =====================================================================
-- Authentic Kitchen — cook avatar + helper functions
-- =====================================================================

-- Cook avatar shown on the customer feed and cook profile pages.
alter table public.cook_profiles
  add column if not exists photo_url text;

-- ---------- Atomic order placement ----------
-- Used by the customer order flow. Validates that:
--   1. The cook is approved
--   2. The dish is active
--   3. The day's availability row exists, is open, hasn't reached cap
-- Then increments portions_taken (and marks the day sold-out / dish
-- sold_out if cap reached) and inserts the order row — all in one
-- transaction so we never oversell.
--
-- Returns the new order id.
create or replace function public.place_order(
  p_dish_id      uuid,
  p_quantity     integer,
  p_type         public.order_type,
  p_scheduled_for date,
  p_total_cents  integer,
  p_commission_cents integer,
  p_cook_payout_cents integer,
  p_notes        text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dish      public.dishes%rowtype;
  v_avail     public.availability%rowtype;
  v_customer  uuid := auth.uid();
  v_order_id  uuid;
begin
  if v_customer is null then
    raise exception 'not authenticated';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'quantity must be at least 1';
  end if;

  -- Lock the dish row to make the transaction safe under concurrency.
  select * into v_dish from public.dishes where id = p_dish_id for update;
  if not found then
    raise exception 'dish not found';
  end if;
  if v_dish.status <> 'active' then
    raise exception 'dish is not active';
  end if;

  -- Cook must be approved.
  if not exists (
    select 1 from public.cook_profiles
    where id = v_dish.cook_id and status = 'approved'
  ) then
    raise exception 'cook is not approved';
  end if;

  -- Lock the availability row for that cook+date.
  select * into v_avail
  from public.availability
  where cook_id = v_dish.cook_id and date = p_scheduled_for
  for update;
  if not found then
    raise exception 'cook is not open on the requested date';
  end if;
  if not v_avail.is_open then
    raise exception 'cook is not open on the requested date';
  end if;
  if v_avail.portions_taken + p_quantity > v_avail.max_portions then
    raise exception 'not enough portions left for that day';
  end if;

  -- Pre-order cutoff: if mode = preorder, scheduled_for must be at
  -- least 24h away from now.
  if v_avail.mode = 'preorder'
     and (p_scheduled_for - current_date) < 1 then
    raise exception 'pre-order window has closed for that day';
  end if;

  -- Increment portions_taken.
  update public.availability
    set portions_taken = portions_taken + p_quantity
    where id = v_avail.id;

  -- If cap reached, flag the dish as sold_out for the day. (We use the
  -- dish status as a sticky "today is full" hint; the cook can flip it
  -- back to active manually for the next open day.)
  if v_avail.portions_taken + p_quantity >= v_avail.max_portions then
    update public.dishes set status = 'sold_out' where id = p_dish_id;
  end if;

  -- Insert the order.
  insert into public.orders (
    customer_id, cook_id, dish_id, quantity,
    total_cents, commission_cents, cook_payout_cents,
    type, status, scheduled_for, notes
  ) values (
    v_customer, v_dish.cook_id, p_dish_id, p_quantity,
    p_total_cents, p_commission_cents, p_cook_payout_cents,
    p_type, 'pending', p_scheduled_for, p_notes
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

-- ---------- Cook health view ----------
-- Powers the admin "cook health" tracker. Computes:
--   - last_order_at      most recent order across all dishes
--   - days_inactive      days since most recent order OR last_active_at
--   - upcoming_open_days how many open availability days in next 7
--   - health_status      derived bucket
create or replace view public.cook_health as
select
  cp.id,
  p.full_name,
  cp.status,
  cp.avg_rating,
  cp.rating_count,
  cp.created_at,
  cp.last_active_at,
  ( select max(o.created_at) from public.orders o where o.cook_id = cp.id ) as last_order_at,
  ( select count(*) from public.availability a
      where a.cook_id = cp.id
        and a.is_open
        and a.date between current_date and current_date + interval '7 days'
  ) as upcoming_open_days,
  ( select count(*) from public.orders o
      where o.cook_id = cp.id
        and o.created_at > now() - interval '7 days'
  ) as orders_last_7d,
  case
    when cp.status <> 'approved' then cp.status::text
    when (
      select max(o.created_at) from public.orders o where o.cook_id = cp.id
    ) is null
    and cp.created_at < now() - interval '14 days'
      then 'inactive'
    when (
      select max(o.created_at) from public.orders o where o.cook_id = cp.id
    ) < now() - interval '14 days'
      then 'inactive'
    when not exists (
      select 1 from public.availability a
      where a.cook_id = cp.id
        and a.is_open
        and a.date between current_date and current_date + interval '7 days'
    )
      then 'no_schedule'
    when (
      select count(*) from public.orders o
      where o.cook_id = cp.id
        and o.created_at > now() - interval '7 days'
    ) = 0
      then 'low_orders'
    else 'active'
  end as health_status
from public.cook_profiles cp
join public.profiles p on p.id = cp.id;

grant select on public.cook_health to authenticated;
