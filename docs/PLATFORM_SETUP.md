# HomeMade — Platform Setup Checklist

Running log of every external service the app talks to, whether it's wired up, and what to do to activate the unconnected ones.

> Open this file when you're ready to finish configuring a service. It's the single source of truth for "which env vars do I need where."

## The big picture

| Service | Purpose | Status |
|---|---|---|
| Supabase | Postgres, auth, storage | ✅ Live |
| Vercel | Hosting + deploys | ✅ Live |
| GitHub | Code repo + auto-deploy | ✅ Live |
| Anthropic | AI review moderation (Claude Haiku) | ✅ Live |
| Sentry | Error tracking | ✅ Live |
| **Upstash** | **Rate limiting / abuse protection** | 🟡 **Code merged, env vars pending** |
| **Resend** | **Transactional email (password reset, order confirmations)** | ⬜ **Not started** |

## Env var master list

Set all of these in **Vercel → Project → Settings → Environment Variables** (select all three scopes: Production, Preview, Development).

| Variable | Purpose | Required? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | ✅ set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | ✅ set |
| `ANTHROPIC_API_KEY` | AI moderation | ✅ set |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry browser | ✅ set |
| `SENTRY_DSN` | Sentry server | ✅ set |
| `SENTRY_ORG` | Sentry source maps | optional |
| `SENTRY_PROJECT` | Sentry source maps | optional |
| `SENTRY_AUTH_TOKEN` | Sentry source maps | optional |
| `UPSTASH_REDIS_REST_URL` | Rate limiting | **pending** |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting | **pending** |
| `RESEND_API_KEY` | Transactional email | **future** |

---

## ⏳ Upstash — Activate rate limiting (~5 min)

The rate-limiting code is already merged (PR #14). Without the env vars, it silently allows all requests. Add the two env vars to activate protection.

**Why:** Stops brute-force password guessing, signup spam, order flooding, and Anthropic budget burn.

**Steps:**

1. Sign up at **https://console.upstash.com/** (free, no card required)
2. Click **Create Database** → pick any region near your users → select the free tier
3. Open the database → **REST API** tab
4. Copy these two values:
   - `UPSTASH_REDIS_REST_URL` (starts with `https://...upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (long base64 string)
5. Add both to Vercel env vars (all three scopes)
6. Trigger a redeploy (push a commit or click **Redeploy** in Vercel)

**Free tier:** 10,000 requests/day. Usage-based billing kicks in after that at ~$0.20/mo. For the current scale this is effectively free.

**Effective buckets (already coded in `src/lib/rate-limit.ts`):**
- Sign-in + forgot-password: **5 per minute per IP**
- Sign-up: **3 per hour per IP**
- Place market order: **30 per hour per user**
- `/api/moderate-review`: **20 per minute per IP**

---

## ⏳ Resend — Transactional email (~3-4 hours of code work)

Not started yet. Plan to tackle when inviting real users.

**Why:** Supabase's default email provider is capped at 3–4 emails/hour and sends from a generic `noreply@mail.supabase.io`. That's enough for one or two test signups but breaks the moment multiple people sign up in the same hour (password resets fail, signup confirmations time out).

**What to wire up:**
- Replace Supabase Auth's default SMTP with Resend
- Add React Email templates for:
  - Order placed (to customer)
  - Order confirmed / ready / completed (to customer on status change)
  - New order (to seller)
  - Seller approved / suspended / shop created (to seller)
  - Admin alert on new seller signup

**Free tier:** 3,000 emails/month + 100 emails/day. $20/mo for 50k emails/month when you grow.

**Prerequisites for setup:**
1. Sign up at **https://resend.com/signup** (free, no card)
2. Buy or verify a domain to send from (optional; can start with `onboarding@resend.dev`)
3. Get API key from Resend → API Keys
4. Add `RESEND_API_KEY` to Vercel env vars
5. Point Supabase Auth SMTP at Resend (Supabase → Authentication → SMTP Settings)

When we're ready to implement, we'll:
- Install `resend` + `@react-email/components`
- Create `src/lib/email.ts` with a generic `sendEmail()` helper
- Create `src/emails/*.tsx` templates
- Call from server actions after DB commits

---

## 🪟 Windows Firewall — Phone access to local dev (user-side)

Your phone can't reach `http://192.168.1.8:3000` because Windows Firewall drops inbound connections to port 3000.

**Fix:** In **Admin PowerShell**, run:

```powershell
New-NetFirewallRule -DisplayName "Node dev server 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

After that, the phone (on same Wi-Fi) can reach `http://192.168.1.8:3000`.

---

## Open PRs as of this doc

Check GitHub for the current list; last known:

- **#14 — Rate limiting** (code ready, waiting on Upstash env vars + merge)

All other PRs (1-13) merged to master.

---

## Admin super-user features (all shipped, live on prod)

Admin can now, without SQL:

- Browse + buy like any customer
- See ADMIN badge + Admin panel link from any page
- View per-seller detail page (`/admin/sellers/[id]`) with profile, products, orders, reviews
- Edit any seller's profile (shop_name, description, category, phone, location)
- Add / edit / pause / delete products for any seller
- Force order status transitions (confirm, ready, complete, cancel)
- Approve / reject / reinstate sellers
- Create a shop for any existing customer (promote to seller)
- View full audit log at `/admin/audit` — every admin action logged with before/after values
