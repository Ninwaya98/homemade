import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";

export default async function LandingPage() {
  const profile = await getCurrentProfile();

  return (
    <main className="min-h-screen">
      {/* Hero — warm dark gradient */}
      <section className="gradient-hero relative overflow-hidden px-5 pt-16 pb-20 sm:pt-28 sm:pb-32">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <p className="animate-fade-up inline-block rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-medium tracking-wide text-amber-200">
            Authentic Kitchen
          </p>
          <h1 className="animate-fade-up delay-1 mt-6 text-4xl font-bold leading-tight text-white sm:text-6xl sm:leading-tight">
            Real food,
            <br />
            <span className="text-amber-300">made by real people.</span>
          </h1>
          <p className="animate-fade-up delay-2 mt-6 text-lg text-amber-100/80 sm:text-xl">
            An alternative to fast food. Order homemade meals from
            approved cooks in your neighbourhood — or open your own
            kitchen and start cooking for them.
          </p>

          <div className="animate-fade-up delay-3 mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {profile ? (
              <Link
                href={
                  { cook: "/cook", seller: "/seller", admin: "/admin", customer: "/customer" }[
                    profile.role as string
                  ] ?? "/customer"
                }
                className="rounded-full bg-white px-7 py-3.5 text-base font-semibold text-amber-900 shadow-lg shadow-amber-900/20 transition hover:bg-amber-50 hover:shadow-xl"
              >
                Continue as {profile.full_name.split(" ")[0]}
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-white px-7 py-3.5 text-base font-semibold text-amber-900 shadow-lg shadow-amber-900/20 transition hover:bg-amber-50 hover:shadow-xl"
                >
                  I&apos;m hungry
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-full border-2 border-amber-300/50 px-7 py-3.5 text-base font-semibold text-white transition hover:border-amber-300 hover:bg-white/10"
                >
                  I&apos;m a cook
                </Link>
              </>
            )}
          </div>

          {!profile && (
            <p className="mt-5 text-sm text-amber-200/60">
              Already with us?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-amber-200 underline underline-offset-2 hover:text-white"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Three story cards */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-amber-700">
            Simple as 1-2-3
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold text-stone-900 sm:text-3xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <Step
              n="1"
              title="Find a cook"
              body="Browse approved home cooks near you. Read their stories, see their photos, check their cuisine."
            />
            <Step
              n="2"
              title="Order with care"
              body="Every dish lists allergens up front. You confirm them again at checkout — no surprises."
            />
            <Step
              n="3"
              title="Pickup or delivery"
              body="Collect from the cook's kitchen or have it brought to you. Then leave a review."
            />
          </div>
        </div>
      </section>

      {/* Cook recruitment strip */}
      <section className="relative overflow-hidden bg-stone-900 px-5 py-20 text-stone-100">
        <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-400">
            For home cooks
          </p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            Cook from home. Earn from your kitchen.
          </h2>
          <p className="mt-5 text-stone-400">
            Set your own schedule, your own portions, your own prices.
            We handle payments and trust — you handle the cooking. New
            cooks start with a 6-portion daily cap and grow from there.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-full bg-amber-500 px-7 py-3.5 text-base font-semibold text-stone-900 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 hover:shadow-xl"
          >
            Open your kitchen
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-stone-50 px-5 py-10 text-center text-sm text-stone-500">
        <p className="font-medium text-stone-600">Authentic Kitchen</p>
        <p className="mt-2">
          A marketplace, not a food producer. Each cook is independently
          approved and responsible for their dishes.
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Link href="/terms" className="transition hover:text-amber-700">Terms of Service</Link>
          <Link href="/privacy" className="transition hover:text-amber-700">Privacy Policy</Link>
        </div>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="group rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-amber-200">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700 text-base font-bold text-white shadow-sm shadow-amber-700/30 transition group-hover:scale-110">
        {n}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
    </div>
  );
}
