# HomeMade

A mobile-first marketplace for handmade goods — crafts, clothing,
home decor, and artisan food products — made by local sellers.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Supabase** — Postgres + Auth + Storage, with `customer` / `seller` /
  `admin` roles
- **Zod** — server action input validation
- **Stripe Connect** — stubbed (not wired yet)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The repo ships with a placeholder `.env.local` so the dev server boots
without a Supabase project. Actually signing up requires real Supabase
credentials — see **Supabase setup** below.

## Supabase setup

1. Create a project at https://app.supabase.com
2. Replace the placeholders in `.env.local` with the URL and anon key
   from Project → Settings → API
3. Open Project → SQL Editor and run the migrations in
   `supabase/migrations/` in order
4. Restart `npm run dev`

### Creating the first admin

Sign up normally, then in Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where id = 'YOUR_USER_ID';
```

Find your user id at Authentication → Users.

## Project layout

- `src/app/seller/` — seller dashboard (products, orders, earnings)
- `src/app/customer/` — customer feed, orders, favorites
- `src/app/admin/` — admin approvals and moderation
- `src/lib/` — schemas, auth guards, Supabase clients, utilities
- `supabase/migrations/` — database schema (kitchen tables remain as
  dormant columns; no new writes)

## Deploy

Push to GitHub and connect to a Vercel project. Add the env vars from
`.env.local` in Project Settings → Environment Variables.
