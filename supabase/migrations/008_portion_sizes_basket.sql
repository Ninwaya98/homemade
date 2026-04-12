-- =====================================================================
-- HomeMade — portion sizes + order basket support
-- =====================================================================

-- 1) Add portion_sizes JSONB column to dishes.
--    NULL = legacy dish using price_cents as the single price.
--    When set, it's an object with keys: small, medium, large.
--    Each key maps to { price_cents: int, label: text, portions: int }.
alter table public.dishes
  add column if not exists portion_sizes jsonb;

-- CHECK: if portion_sizes is not null, at least one key must be present
-- and each present key must have a positive price_cents and portions > 0.
alter table public.dishes
  add constraint dishes_portion_sizes_valid check (
    portion_sizes is null
    or (
      (
        portion_sizes ? 'small'
        or portion_sizes ? 'medium'
        or portion_sizes ? 'large'
      )
      and (
        not portion_sizes ? 'small'
        or (
          (portion_sizes->'small'->>'price_cents')::int > 0
          and (portion_sizes->'small'->>'portions')::int > 0
        )
      )
      and (
        not portion_sizes ? 'medium'
        or (
          (portion_sizes->'medium'->>'price_cents')::int > 0
          and (portion_sizes->'medium'->>'portions')::int > 0
        )
      )
      and (
        not portion_sizes ? 'large'
        or (
          (portion_sizes->'large'->>'price_cents')::int > 0
          and (portion_sizes->'large'->>'portions')::int > 0
        )
      )
    )
  );

-- 2) Add portion_size column to orders to record which size was selected.
--    NULL = legacy order placed before portion sizes existed.
alter table public.orders
  add column if not exists portion_size text;

-- 3) Replace place_order RPC to accept and store portion_size,
--    and to consume the correct number of portions based on size.
create or replace function public.place_order(
  p_dish_id          uuid,
  p_quantity         integer,
  p_type             public.order_type,
  p_scheduled_for    date,
  p_total_cents      integer,
  p_commission_cents integer,
  p_cook_payout_cents integer,
  p_notes            text default null,
  p_portion_size     text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dish           public.dishes%rowtype;
  v_avail          public.availability%rowtype;
  v_customer       uuid := auth.uid();
  v_order_id       uuid;
  v_portions_per   integer;
  v_total_portions integer;
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

  -- Determine portions consumed per unit.
  -- If portion_size is provided AND the dish has portion_sizes, look it up.
  -- Otherwise, fall back to 1 portion per unit (legacy behavior).
  if p_portion_size is not null and v_dish.portion_sizes is not null then
    if not v_dish.portion_sizes ? p_portion_size then
      raise exception 'invalid portion size: %', p_portion_size;
    end if;
    v_portions_per := (v_dish.portion_sizes->p_portion_size->>'portions')::integer;
  else
    v_portions_per := 1;
  end if;

  v_total_portions := v_portions_per * p_quantity;

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
  if v_avail.portions_taken + v_total_portions > v_avail.max_portions then
    raise exception 'not enough portions left for that day';
  end if;

  -- Pre-order cutoff: if mode = preorder, scheduled_for must be
  -- at least 1 day in the future (cannot order for today).
  if v_avail.mode = 'preorder'
     and p_scheduled_for <= current_date then
    raise exception 'pre-order window has closed for that day';
  end if;

  -- Increment portions_taken by the TOTAL portions consumed.
  update public.availability
    set portions_taken = portions_taken + v_total_portions
    where id = v_avail.id;

  -- Insert the order.
  insert into public.orders (
    customer_id, cook_id, dish_id, quantity,
    total_cents, commission_cents, cook_payout_cents,
    type, status, scheduled_for, notes, portion_size
  ) values (
    v_customer, v_dish.cook_id, p_dish_id, p_quantity,
    p_total_cents, p_commission_cents, p_cook_payout_cents,
    p_type, 'pending', p_scheduled_for, p_notes, p_portion_size
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;
