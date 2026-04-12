-- =====================================================================
-- HomeMade — weekly schedule template + availability toggle
-- =====================================================================
-- Cooks set a recurring weekly schedule (Mon-Sun) instead of picking
-- specific dates each week. They can also toggle themselves as
-- "not available" to temporarily go offline.
-- =====================================================================

-- 1) Add weekly_schedule JSONB to cook_profiles.
--    Keys are day-of-week (0=Sunday .. 6=Saturday).
--    Each key maps to { is_open: bool, mode: text, max_portions: int }.
--    Example: {"1": {"is_open": true, "mode": "preorder", "max_portions": 6}, ...}
alter table public.cook_profiles
  add column if not exists weekly_schedule jsonb;

-- 2) Add is_available toggle (quick on/off without editing schedule).
alter table public.cook_profiles
  add column if not exists is_available boolean not null default true;

-- 3) Update place_order RPC to check is_available and use weekly_schedule
--    when no specific availability row exists for a date.
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
  v_cook           public.cook_profiles%rowtype;
  v_customer       uuid := auth.uid();
  v_order_id       uuid;
  v_portions_per   integer;
  v_total_portions integer;
  v_day_of_week    integer;
  v_schedule_day   jsonb;
begin
  if v_customer is null then
    raise exception 'not authenticated';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'quantity must be at least 1';
  end if;

  -- Lock the dish row.
  select * into v_dish from public.dishes where id = p_dish_id for update;
  if not found then
    raise exception 'dish not found';
  end if;
  if v_dish.status <> 'active' then
    raise exception 'dish is not active';
  end if;

  -- Cook must be approved AND available.
  select * into v_cook from public.cook_profiles
    where id = v_dish.cook_id and status = 'approved';
  if not found then
    raise exception 'cook is not approved';
  end if;
  if not v_cook.is_available then
    raise exception 'cook is currently not available';
  end if;

  -- Determine portions consumed per unit.
  if p_portion_size is not null and v_dish.portion_sizes is not null then
    if not v_dish.portion_sizes ? p_portion_size then
      raise exception 'invalid portion size: %', p_portion_size;
    end if;
    v_portions_per := (v_dish.portion_sizes->p_portion_size->>'portions')::integer;
  else
    v_portions_per := 1;
  end if;
  v_total_portions := v_portions_per * p_quantity;

  -- Try to find an existing availability row for this cook+date.
  select * into v_avail
  from public.availability
  where cook_id = v_dish.cook_id and date = p_scheduled_for
  for update;

  if not found then
    -- No specific row — check weekly_schedule template.
    v_day_of_week := extract(dow from p_scheduled_for)::integer;
    v_schedule_day := v_cook.weekly_schedule -> v_day_of_week::text;

    if v_schedule_day is null or not (v_schedule_day->>'is_open')::boolean then
      raise exception 'cook is not open on the requested date';
    end if;

    -- Auto-create an availability row from the template.
    insert into public.availability (cook_id, date, is_open, mode, max_portions, portions_taken)
    values (
      v_dish.cook_id,
      p_scheduled_for,
      true,
      (v_schedule_day->>'mode')::public.availability_mode,
      (v_schedule_day->>'max_portions')::integer,
      0
    )
    returning * into v_avail;
  end if;

  if not v_avail.is_open then
    raise exception 'cook is not open on the requested date';
  end if;
  if v_avail.portions_taken + v_total_portions > v_avail.max_portions then
    raise exception 'not enough portions left for that day';
  end if;

  -- Pre-order cutoff.
  if v_avail.mode = 'preorder' and p_scheduled_for <= current_date then
    raise exception 'pre-order window has closed for that day';
  end if;

  -- Increment portions_taken.
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
