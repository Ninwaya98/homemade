# HomeMade

Marketplace for handmade goods — crafts, clothing, home decor, and
artisan food products. Brand color = purple.

## Stack
- Next.js 16 (App Router, TypeScript, Tailwind v4 with `@custom-variant dark`)
- Supabase (Postgres + Auth + Storage + RLS + Triggers)
- Zod (server action input validation)
- Stripe Connect (stubbed — not wired yet)

## Project structure

### Actions — split by feature domain (barrel re-exported)
```
src/app/seller/actions/     — onboarding, products, orders, reviews
src/app/customer/actions/   — market-orders, reviews
src/app/actions/            — auth, favorites, addresses
src/app/admin/actions.ts    — approvals, moderation
```

### Constants — split by domain (barrel re-exported)
```
src/lib/constants/          — allergens, portions, products, pricing, dates
```
Import from `@/lib/constants` works (re-exports from `constants/index.ts`).

### Components — barrel exports available
```
src/components/ui/index.ts  — all UI components (Button, Card, Badge, Field, etc.)
src/components/feed/index.ts — feed components (ProductCard, SellerCard, etc.)
```

### Key lib files
- `src/lib/schemas.ts` — Zod validation schemas for all server actions
- `src/lib/file-validation.ts` — shared file type/size validation
- `src/lib/hooks.ts` — useClickOutside, useEscapeKey
- `src/lib/auth.ts` — auth guards
- `src/lib/order-utils.ts` — shared order FSM
- `src/lib/review-utils.ts` — score helpers (DB trigger handles recalculation)
- `src/lib/supabase/{client,server,proxy}.ts` — Supabase clients
- `src/proxy.ts` — Next.js 16 middleware

## Roles
- `customer` — browses the feed, places orders, leaves reviews
- `seller` — lists products, manages orders
- `admin` — approves sellers, moderates reviews

## Database
- Migrations in `supabase/migrations/`
- Generated types: `npx supabase gen types typescript --linked > src/lib/database.types.ts 2>/dev/null`
- Kitchen-era migrations (`cook_profiles`, `dishes`, availability, kitchen
  order columns) remain in the migration history as DORMANT schema. No
  new code writes to them. Do not drop them without a separate cleanup
  migration.

## Important patterns
- Orders table still carries `vertical` + `cook_id`/`dish_id` columns
  from the legacy schema; new writes always use `vertical = 'market'`
  and leave the kitchen columns null
- Review scores calculated by DB trigger, not JavaScript
- All server actions validated with Zod schemas from `src/lib/schemas.ts`
- Dark mode: `@custom-variant dark` + global CSS overrides in globals.css
- Card accents: thin border + corner gradient wash (not blurry blobs)
- Dark mode toggle lives inside ProfileDropdown, not as standalone button

@AGENTS.md
