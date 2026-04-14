-- =====================================================================
-- HomeMade — security fixes & performance indexes
-- =====================================================================
-- Addresses critical audit findings:
--   1. Notifications insert policy allows inserting for any user
--   2. place_product_order() allows self-purchase
--   3. Missing composite indexes for common query patterns
--   4. place_order() missing server-side price validation
--   5. place_product_order() missing server-side price validation
-- =====================================================================

-- =====================================================================
-- 1. FIX: Notifications insert policy
--    Old policy: WITH CHECK (true) — any authenticated user can insert
--    notifications for ANY user_id.
--    New policy: only allow inserting where user_id = auth.uid().
--    The create_notification() RPC (SECURITY DEFINER) can still insert
--    for other users when called from server/triggers.
-- =====================================================================
DROP POLICY IF EXISTS "notifications: self insert" ON notifications;
CREATE POLICY "notifications: backend insert"
  ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);


-- =====================================================================
-- 2. FIX: place_product_order() — prevent self-purchase + price check
--    Recreate with:
--    a) Self-purchase guard: customer cannot buy their own product
--    b) Price validation: p_total_cents must equal price_cents * quantity
-- =====================================================================
CREATE OR REPLACE FUNCTION public.place_product_order(
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
  v_expected_total integer;
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

  -- SECURITY: prevent self-purchase.
  if v_customer = v_product.seller_id then
    raise exception 'cannot purchase your own product';
  end if;

  -- SECURITY: server-side price validation.
  v_expected_total := v_product.price_cents * p_quantity;
  if p_total_cents <> v_expected_total then
    raise exception 'price mismatch: expected % cents, got % cents',
      v_expected_total, p_total_cents;
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


-- =====================================================================
-- 3. ADD: Missing composite indexes for performance
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_availability_cook_date
  ON availability(cook_id, date);

CREATE INDEX IF NOT EXISTS idx_orders_cook_status
  ON orders(cook_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_customer_status
  ON orders(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_vertical
  ON orders(vertical);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer
  ON reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_cook_profiles_available
  ON cook_profiles(is_available) WHERE is_available = true;


-- =====================================================================
-- 4. FIX: place_order() — add server-side price validation
--    Recreate the full function from migration 010 with price check.
--    For portion-sized dishes: expected = portion price * quantity
--    For legacy dishes (no portion_sizes): expected = price_cents * quantity
-- =====================================================================
CREATE OR REPLACE FUNCTION public.place_order(
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
  v_expected_total integer;
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

  -- SECURITY: server-side price validation.
  if p_portion_size is not null and v_dish.portion_sizes is not null then
    -- Portion-sized order: expected = portion_price * quantity
    v_expected_total := (v_dish.portion_sizes->p_portion_size->>'price_cents')::integer * p_quantity;
  else
    -- Legacy dish: expected = dish price * quantity
    v_expected_total := v_dish.price_cents * p_quantity;
  end if;

  if p_total_cents <> v_expected_total then
    raise exception 'price mismatch: expected % cents, got % cents',
      v_expected_total, p_total_cents;
  end if;

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
