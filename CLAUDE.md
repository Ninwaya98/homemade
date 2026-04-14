# HomeMade

Two-vertical marketplace: **HomeMade Food** (home-cooked food, rose) + **HomeMade Art** (handmade goods, sky blue). Brand color = purple (rose + blue).

## Stack
- Next.js 16 (App Router, TypeScript, Tailwind v4 with `@custom-variant dark`)
- Supabase (Postgres + Auth + Storage + RLS + Triggers)
- Zod (server action input validation)
- Stripe Connect (stubbed — not wired yet)

## Project structure

### Actions — split by feature domain (barrel re-exported)
```
src/app/cook/actions/       — onboarding, dishes, schedule, orders, reviews
src/app/seller/actions/     — onboarding, products, orders, reviews
src/app/customer/actions/   — kitchen-orders, market-orders, reviews
src/app/actions/            — auth, favorites, addresses
```
Each role's `actions.ts` re-exports from `actions/index.ts`. Import from `@/app/cook/actions` works.

### Constants — split by domain (barrel re-exported)
```
src/lib/constants/          — allergens, portions, products, pricing, dates
```
Import from `@/lib/constants` works (re-exports from `constants/index.ts`).

### Components — barrel exports available
```
src/components/ui/index.ts  — all UI components (Button, Card, Badge, Field, etc.)
src/components/feed/index.ts — all feed components (DishCard, ProductCard, CookCard, etc.)
```

### Key lib files
- `src/lib/schemas.ts` — Zod validation schemas for all server actions
- `src/lib/file-validation.ts` — shared file type/size validation
- `src/lib/hooks.ts` — useClickOutside, useEscapeKey
- `src/lib/auth.ts` — auth guards (41 importers — don't restructure)
- `src/lib/order-utils.ts` — shared order FSM
- `src/lib/review-utils.ts` — score helpers (DB trigger handles recalculation)
- `src/lib/supabase/{client,server,proxy}.ts` — Supabase clients
- `src/proxy.ts` — Next.js 16 middleware

## Roles
- `customer` — browses Kitchen + Market, places orders, leaves reviews
- `cook` — lists dishes, manages food orders (Kitchen vertical)
- `seller` — lists products, manages goods orders (Market vertical)
- `admin` — approves cooks/sellers, moderates reviews

## Database
- 15 migrations in `supabase/migrations/` (001-015)
- Generated types: `npx supabase gen types typescript --linked > src/lib/database.types.ts 2>/dev/null`
- Migration 014: security fixes (RLS, price validation, indexes)
- Migration 015: review score trigger (auto-recalculates on review changes)

## Important patterns
- Order table unified with `vertical: 'kitchen' | 'market'` discriminator
- Review scores calculated by DB trigger, not JavaScript
- All server actions validated with Zod schemas from `src/lib/schemas.ts`
- Dark mode: `@custom-variant dark` + global CSS overrides in globals.css
- Card accents: thin border + corner gradient wash (not blurry blobs)
- Dashboard headers: cook = "HomeMade Kitchen", seller = "HomeMade Art"
- Dark mode toggle lives inside ProfileDropdown, not as standalone button

@AGENTS.md
