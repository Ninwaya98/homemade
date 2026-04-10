# HomeMade

Two-vertical marketplace platform: **HomeMade Kitchen** (home-cooked food) + **HomeMade Market** (handmade goods).

## Stack
- Next.js 16 (App Router, TypeScript, Tailwind v4)
- Supabase (Postgres + Auth + Storage)
- Stripe Connect (stubbed — not wired yet)

## Key files
- `src/lib/auth.ts` — `getCurrentProfile()`, `requireRole(role)`
- `src/lib/constants.ts` — allergens, cuisines, product categories, price helpers
- `src/lib/types.ts` — convenience type aliases from generated DB types + manual seller types
- `src/lib/order-utils.ts` — shared order FSM transitions and timestamp helpers
- `src/lib/supabase/{client,server,proxy}.ts` — Supabase client setup
- `src/proxy.ts` — Next.js 16 middleware (guards /cook, /seller, /customer, /admin)

## Roles
- `customer` — browses both Kitchen and Market, places orders
- `cook` — lists dishes, manages food orders (Kitchen vertical)
- `seller` — lists products, manages goods orders (Market vertical)
- `admin` — approves cooks/sellers, monitors health dashboards

## Route structure
```
/                     Landing (two-vertical hero)
/sign-up              Role selection: customer | cook | seller
/cook/*               Kitchen seller dashboard
/seller/*             Market seller dashboard
/customer             Two-doors chooser (Kitchen | Market)
/customer/kitchen     Food browse feed
/customer/market      Goods browse feed
/customer/orders      Unified order history (both verticals)
/admin                Cook approvals + seller approvals
```

## Database
- Migrations in `supabase/migrations/` (001-007)
- Generated types: `npx supabase gen types typescript --linked > src/lib/database.types.ts 2>/dev/null`
- Seller tables (007) not in generated types yet — manual types in `types.ts`, queries use `as any` casts

## Important patterns
- Seller/product queries cast `supabase as any` since generated types don't include migration 007 tables
- Order table is unified with `vertical: 'kitchen' | 'market'` discriminator
- `cook_payout_cents` column is reused for seller payouts (same column, both verticals)
- Order FSM logic is shared via `src/lib/order-utils.ts`

@AGENTS.md
