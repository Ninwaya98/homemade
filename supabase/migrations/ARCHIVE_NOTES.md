# Kitchen-era dormant schema — archive notes

**Pivot date:** 2026-04-21
**Reason:** HomeMade launched Art-only because food-business approvals were unavailable in Erbil. The UI for the Kitchen (food) vertical was removed, but the underlying database schema was deliberately preserved so the feature can be reactivated without a data-migration round.

## What was removed from the application

- All routes under `src/app/cook/**`, `src/app/customer/kitchen/**`, `src/app/customer/basket/**`, `src/app/customer/order/**`, `src/app/customer/cooks/**`, and `src/app/admin/cooks/**`
- Server action `src/app/customer/actions/kitchen-orders.ts`
- Components `src/components/feed/DishCard.tsx`, `src/components/ui/BasketBadge.tsx`, `src/app/admin/cook-approval-row.tsx`
- Library modules `src/lib/basket.tsx` and kitchen types from `src/lib/types.ts`
- Admin actions `approveCook` / `rejectCook` / `reinstateCook`
- Auth helper `requireCookProfile`

Full deleted code is preserved on the **`kitchen-archive`** branch, created at commit **`4edbadb`** (HEAD at the time of the pivot). To inspect or cherry-pick the original implementation:

```bash
git checkout kitchen-archive
# or view a single file without checking out
git show kitchen-archive:src/app/cook/layout.tsx
```

## What stays dormant in the database

These tables and enum values are NOT dropped. They still exist with their data intact. No current code path reads or writes to them. A future reactivation (or a separate cleanup migration) can decide their fate.

### Tables (still present)
- `cook_profiles`
- `dishes`
- `availability`
- `cook_weekly_schedule` (if present)

### Enum values still declared
- `user_role` — still includes `'cook'`. No new signup can pick this role.
- `orders.vertical` — still the union `'kitchen' | 'market'`. **All new writes must use `'market'`.**

### Order columns (still present, always NULL for new orders)
- `orders.cook_id`
- `orders.dish_id`
- `orders.portion_size`
- `orders.cook_payout_cents` (note: legacy name retained; used for seller payouts in art orders)

### Storage buckets (still exist, no new uploads)
- `cook-photos` (public)
- `dish-photos` (public)
- `certificates` (private — kitchen food-handler certs)

### Triggers and functions (preserved)
- `handle_new_user()` still reads `role` from signup metadata — signup code no longer passes `'cook'`, so the trigger will only see `customer` / `seller` / `admin`.
- Review-score trigger (migration 015) still targets both `cook_profiles` and `seller_profiles`; the cook branch is effectively a no-op now.

## Rules when modifying this project

1. **Do not drop the dormant tables or enum values** without a dedicated cleanup migration and explicit confirmation.
2. **Do not reintroduce the kitchen UI or server actions** on the main line — create a feature branch and re-enable from `kitchen-archive` context.
3. **New code writing to `orders` must explicitly set `vertical = 'market'`** and leave `cook_id` / `dish_id` / `portion_size` NULL. The `place_product_order()` RPC handles this correctly.
4. **If a new feature needs a constraint** forcing new orders to be art-only, add a CHECK constraint in a new migration:
   ```sql
   alter table public.orders
     add constraint orders_new_writes_market_only
     check (vertical = 'market' or cook_id is not null);
   ```
   (Grandfathers historical kitchen orders while blocking new accidental kitchen writes.)

## Reactivation path (if food approvals land later)

1. `git checkout kitchen-archive -- src/app/cook/ src/app/customer/kitchen/ src/app/customer/basket/ src/app/customer/order/ src/app/customer/cooks/ src/app/admin/cooks/ src/app/customer/actions/kitchen-orders.ts src/components/feed/DishCard.tsx src/lib/basket.tsx`
2. Restore `requireCookProfile` in `src/lib/auth.ts` and kitchen types in `src/lib/types.ts`
3. Re-add `approveCook` / `rejectCook` / `reinstateCook` in `src/app/admin/actions.ts`
4. Re-add kitchen pills in `src/components/feed/CategoryPills.tsx` and the "HomeMade Food" nav item in `src/app/customer/layout.tsx`
5. Re-wire `BasketProvider` in `src/app/customer/layout.tsx` + restore `BasketBadge`
6. Drop this constraint if it was added: `alter table public.orders drop constraint orders_new_writes_market_only;`
7. Re-enable `cook` as a signup option on `/sign-up`

Because the DB schema was never dropped, no data migration is needed — existing rows in `cook_profiles` / `dishes` come back live the moment the UI is restored.
