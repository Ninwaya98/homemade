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

## Seller tables not in generated types
Migration 007 added `seller_profiles`, `products`, and extended `orders` with `vertical`/`seller_id`/`product_id`. These are NOT in `database.types.ts` yet. Cast `supabase as any` for seller/product queries. Regenerate types after confirming schema is stable.
