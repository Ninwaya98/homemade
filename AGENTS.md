# HomeMade — Agent Instructions

## Next.js 16 breaking changes
This version has breaking changes from training data. Read `node_modules/next/dist/docs/` before writing code.
- `middleware.ts` is now `proxy.ts`
- `cookies()` is async — `await cookies()`
- `params` and `searchParams` are Promises in pages
- Tailwind v4: `@import "tailwindcss"` and `@theme inline { ... }`

## Supabase SSR 0.10
- Cookie handlers MUST use `getAll`/`setAll` (not deprecated `get`/`set`/`remove`)
- `setAll` receives a second `headers` argument — propagate to response

## Art-only pivot
HomeMade is now Art-only. The kitchen vertical (home-cooked food) has
been removed from the UI. The corresponding database tables
(`cook_profiles`, `dishes`, `availability`, kitchen-era order columns
like `cook_id` / `dish_id` / `portion_size`) are kept in migrations as
DORMANT schema — existing rows are preserved, new writes always set
`orders.vertical = 'market'` and leave kitchen columns null. The full
kitchen codebase is preserved on the `kitchen-archive` branch for
historical reference.

When editing:
- Do not reintroduce cook/kitchen UI or server actions
- Do not query `cook_profiles` / `dishes` outside of admin cleanup work
- Cast `supabase as any` for seller/product queries (see below)

## Seller tables and `any` casts
`seller_profiles`, `products`, and order columns `vertical` / `seller_id`
/ `product_id` are not fully typed in `database.types.ts`. Cast
`supabase as any` for these queries until the types are regenerated.
