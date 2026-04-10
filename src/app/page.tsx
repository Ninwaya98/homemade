import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";

export default async function LandingPage() {
  const profile = await getCurrentProfile();

  const home: Record<string, string> = {
    cook: "/cook", seller: "/seller", admin: "/admin", customer: "/customer",
  };

  return (
    <main className="min-h-screen gradient-mesh overflow-hidden">
      {/* ── Floating blobs ──────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-300/30 blur-3xl animate-float" />
        <div className="absolute top-1/4 -right-24 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl animate-float delay-2" />
        <div className="absolute bottom-1/4 left-1/4 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl animate-float delay-4" />
      </div>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="glass-header sticky top-0 z-50 px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xl font-black tracking-tight">
            <span className="gradient-text-animate">
              HomeMade
            </span>
          </span>
          <div className="flex items-center gap-3">
            {profile ? (
              <Link
                href={home[profile.role as string] ?? "/customer"}
                className="glass rounded-full px-5 py-2 text-sm font-semibold text-violet-700 transition hover:bg-white/80"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-slate-600 transition hover:text-violet-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="gradient-purple rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative px-5 pt-16 pb-8 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="animate-scale-in inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-white/60 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-sm font-medium text-violet-700">Now open for cooks & sellers</span>
          </div>

          <h1 className="animate-fade-up delay-1 mt-8 text-5xl font-black leading-tight tracking-tight sm:text-7xl">
            Everything
            <br />
            <span className="gradient-text-animate">
              HomeMade
            </span>
          </h1>

          <p className="animate-fade-up delay-2 mx-auto mt-6 max-w-lg text-lg text-slate-500 sm:text-xl">
            Fresh food from home cooks. Handmade goods from local artisans.
            All from people in your neighbourhood.
          </p>

          <div className="animate-fade-up delay-3 mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {profile ? (
              <Link
                href={home[profile.role as string] ?? "/customer"}
                className="gradient-purple rounded-2xl px-8 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl"
              >
                Continue as {profile.full_name.split(" ")[0]}
              </Link>
            ) : (
              <>
                <Link
                  href="/customer"
                  className="gradient-purple rounded-2xl px-8 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:scale-105"
                >
                  Start browsing
                </Link>
                <Link
                  href="/sign-up"
                  className="glass rounded-2xl px-8 py-4 text-base font-bold text-violet-700 transition hover:bg-white/80 hover:scale-105"
                >
                  I make things
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Two doors ───────────────────────────────────────── */}
      <section className="relative px-5 py-16">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          {/* Kitchen card */}
          <Link href="/customer/kitchen" className="group">
            <div className="card-hover glass-strong rounded-3xl p-8 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-100 to-blue-200 text-5xl shadow-lg shadow-blue-200/40 transition group-hover:scale-110 group-hover:shadow-xl">
                🍳
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-800">Kitchen</h2>
              <p className="mt-2 text-sm text-slate-500">
                Home-cooked meals from approved cooks.
                <br />
                Pre-order or get it fresh today.
              </p>
              <div className="mt-5 inline-flex items-center gap-1 rounded-full bg-sky-100/80 px-4 py-1.5 text-sm font-semibold text-sky-700">
                Browse food &rarr;
              </div>
            </div>
          </Link>

          {/* Market card */}
          <Link href="/customer/market" className="group">
            <div className="card-hover glass-strong rounded-3xl p-8 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-purple-200 text-5xl shadow-lg shadow-purple-200/40 transition group-hover:scale-110 group-hover:shadow-xl">
                🎨
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-800">Market</h2>
              <p className="mt-2 text-sm text-slate-500">
                Handmade crafts, clothing, decor & more.
                <br />
                All made locally by real people.
              </p>
              <div className="mt-5 inline-flex items-center gap-1 rounded-full bg-violet-100/80 px-4 py-1.5 text-sm font-semibold text-violet-700">
                Browse goods &rarr;
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="relative px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-sm font-bold uppercase tracking-widest text-violet-400">
            How it works
          </h2>
          <p className="mt-2 text-center text-3xl font-black text-slate-800">
            Simple as 1-2-3
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <Step
              icon="🔍"
              color="from-sky-100 to-blue-200"
              shadow="shadow-blue-200/40"
              title="Find"
              body="Browse approved cooks and sellers near you. Read their stories and see what they offer."
              delay="delay-1"
            />
            <Step
              icon="🛒"
              color="from-rose-100 to-pink-200"
              shadow="shadow-pink-200/40"
              title="Order"
              body="Pick what you love, choose pickup or delivery. Every food dish lists allergens up front."
              delay="delay-2"
            />
            <Step
              icon="⭐"
              color="from-violet-100 to-purple-200"
              shadow="shadow-purple-200/40"
              title="Enjoy & review"
              body="Get your order and leave a review. Help others discover great cooks and makers."
              delay="delay-3"
            />
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────── */}
      <section className="relative px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-black text-slate-800">
            What you&apos;ll find
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <CategoryPill icon="🥘" label="Home cooking" color="bg-sky-100/80 text-sky-800" />
            <CategoryPill icon="🎨" label="Crafts & Art" color="bg-violet-100/80 text-violet-800" />
            <CategoryPill icon="👗" label="Clothing" color="bg-sky-100/80 text-sky-800" />
            <CategoryPill icon="🏠" label="Home decor" color="bg-rose-100/80 text-rose-800" />
            <CategoryPill icon="🍯" label="Packaged food" color="bg-sky-100/80 text-sky-800" />
            <CategoryPill icon="🕯️" label="Candles & Soap" color="bg-violet-100/80 text-violet-800" />
            <CategoryPill icon="💍" label="Jewelry" color="bg-sky-100/80 text-sky-800" />
            <CategoryPill icon="🧶" label="Textiles" color="bg-rose-100/80 text-rose-800" />
          </div>
        </div>
      </section>

      {/* ── CTA for creators ────────────────────────────────── */}
      <section className="relative px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="glass-strong overflow-hidden rounded-3xl">
            <div className="grid sm:grid-cols-2">
              {/* Cook CTA */}
              <div className="border-b border-white/30 p-8 sm:border-b-0 sm:border-r">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-200 text-3xl shadow-md">
                  👨‍🍳
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-800">Cook from home</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Set your schedule, your portions, your prices. We handle the trust — you handle the cooking.
                </p>
                <Link
                  href="/sign-up"
                  className="mt-5 inline-flex items-center gap-1 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:shadow-lg"
                >
                  Open your kitchen
                </Link>
              </div>

              {/* Seller CTA */}
              <div className="p-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-200 text-3xl shadow-md">
                  🛍️
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-800">Sell what you make</h3>
                <p className="mt-2 text-sm text-slate-500">
                  List your handmade goods, set your stock, reach local buyers. Simple and free to start.
                </p>
                <Link
                  href="/sign-up"
                  className="mt-5 inline-flex items-center gap-1 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition hover:shadow-lg"
                >
                  Open your shop
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative px-5 py-12 text-center">
        <p className="text-xl font-black">
          <span className="gradient-text-animate">
            HomeMade
          </span>
        </p>
        <p className="mt-3 text-sm text-slate-400">
          A marketplace, not a producer. Each cook and seller is independently
          approved and responsible for their products.
        </p>
        <div className="mt-4 flex justify-center gap-4 text-sm text-slate-400">
          <Link href="/terms" className="transition hover:text-violet-500">Terms</Link>
          <Link href="/privacy" className="transition hover:text-violet-500">Privacy</Link>
        </div>
      </footer>
    </main>
  );
}

/* ── Components ──────────────────────────────────────────── */

function Step({
  icon,
  color,
  shadow,
  title,
  body,
  delay,
}: {
  icon: string;
  color: string;
  shadow: string;
  title: string;
  body: string;
  delay: string;
}) {
  return (
    <div className={`animate-fade-up ${delay} glass-strong rounded-3xl p-6 text-center`}>
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-3xl shadow-lg ${shadow}`}>
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-black text-slate-800">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}

function CategoryPill({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div className={`glass-strong flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:scale-105`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </div>
  );
}
