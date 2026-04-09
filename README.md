# Authentic Kitchen

A two-sided mobile-first marketplace connecting home cooks with people
who want authentic, homemade food. Think Airbnb for home cooking —
cooks list dishes, customers order, the platform handles trust and
payments.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4) — deploys to Netlify
- **Supabase** — Postgres + auth + storage, with `cook` / `customer` /
  `admin` roles
- **Stripe Connect** — Phase 1 MVP, 15–18% platform commission
- **SendGrid** — transactional email, Phase 1

## What's in this scaffold (foundation only)

- `supabase/migrations/001_initial_schema.sql` — full schema
  (profiles, cook_profiles, dishes, availability, orders, reviews,
  payouts) with enums, RLS policies, and a trigger that auto-creates a
  profile row on signup
- Supabase server / browser / proxy clients in `src/lib/supabase/`
- Server actions for sign-up / sign-in / sign-out in
  `src/app/actions/auth.ts`
- Auth pages with role selection at `/sign-up` and `/sign-in`
- Role-protected route groups: `/cook`, `/customer`, `/admin` — each
  enforces its role server-side via `requireRole()` in `src/lib/auth.ts`
- A warm, mobile-first landing page at `/`
- A `proxy.ts` (Next 16's renamed middleware) that refreshes the
  Supabase session on every request and bounces unauthenticated users
  away from protected areas

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The repo ships with a placeholder `.env.local` so the dev server boots
without a Supabase project. The landing page and auth UI render fine,
but actually signing up requires real Supabase credentials — see
**Supabase setup** below.

## Supabase setup

1. Create a project at https://app.supabase.com
2. Replace the placeholders in `.env.local` with the URL and anon key
   from Project → Settings → API
3. Open Project → SQL Editor, paste the contents of
   `supabase/migrations/001_initial_schema.sql`, run it
4. Restart `npm run dev`

### Creating the first admin

Sign up normally as a customer or cook, then in Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where id = 'YOUR_USER_ID';
```

Find your user id at Authentication → Users.

## Critical business rules baked into the schema

- Cooks must be admin-approved before their dishes are visible (RLS on
  `dishes` requires `cook_profiles.status = 'approved'`)
- Reviews can only be inserted for orders with `status = 'completed'`
  (RLS check)
- Allergens are a `text[]` column on every dish — the application
  enforces that the checklist must be completed
- Daily portion caps default to 6 for new cooks (`availability.max_portions`)
- The `handle_new_user()` trigger creates a profile row automatically
  on signup, reading `role` from `raw_user_meta_data`

## Build order — what's next

This is **Phase 1, foundation only**. Next pieces from the build brief:

1. Cook onboarding form (bio, cuisine, certificate upload)
2. Admin cook approval screen
3. Dish manager with mandatory allergen checklist
4. Weekly availability + portion cap + 24-hour pre-order cutoff
5. Customer browse feed with cuisine / dietary / pickup-vs-delivery filters
6. Order flow with allergen confirmation + Stripe Connect checkout
7. Order status management (cook confirms / marks ready / customer collects)
8. Reviews (only on completed orders, weekly digest to cook)
9. Cook earnings dashboard
10. Admin cook health tracker (auto-flag inactive 14+ days)
11. Notifications (Sunday schedule nudge, sold-out alerts)
12. Phase 2 growth features (re-order shortcut, Home Table membership,
    referrals, ingredient cost estimator)

## Deploy

Standard Netlify auto-deploy:

1. Push the repo to GitHub
2. Connect on Netlify — it auto-detects Next.js
3. Add the env vars from `.env.local` in Netlify → Site Settings →
   Environment variables
