import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";

export default async function LandingPage() {
  const profile = await getCurrentProfile();

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative px-5 pt-14 pb-16 sm:pt-24 sm:pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium tracking-wide text-amber-700 uppercase">
            Authentic Kitchen
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-900 sm:text-6xl">
            Real food,
            <br />
            made by real people.
          </h1>
          <p className="mt-6 text-lg text-stone-600 sm:text-xl">
            An alternative to fast food. Order homemade meals from
            approved cooks in your neighbourhood — or open your own
            kitchen and start cooking for them.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {profile ? (
              <Link
                href={
                  profile.role === "cook"
                    ? "/cook"
                    : profile.role === "admin"
                    ? "/admin"
                    : "/customer"
                }
                className="rounded-full bg-amber-700 px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-amber-800"
              >
                Continue as {profile.full_name.split(" ")[0]}
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-amber-700 px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-amber-800"
                >
                  I&apos;m hungry
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-full border-2 border-stone-900 px-6 py-3 text-base font-medium text-stone-900 transition hover:bg-stone-900 hover:text-white"
                >
                  I&apos;m a cook
                </Link>
              </>
            )}
          </div>

          {!profile && (
            <p className="mt-4 text-sm text-stone-500">
              Already with us?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-amber-700 hover:text-amber-800"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Three story cards */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-semibold text-stone-900 sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
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
      <section className="bg-stone-900 px-5 py-16 text-stone-100">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Cook from home. Earn from your kitchen.
          </h2>
          <p className="mt-4 text-stone-300">
            Set your own schedule, your own portions, your own prices.
            We handle payments and trust — you handle the cooking. New
            cooks start with a 6-portion daily cap and grow from there.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-full bg-amber-500 px-6 py-3 text-base font-medium text-stone-900 transition hover:bg-amber-400"
          >
            Open your kitchen
          </Link>
        </div>
      </section>

      <footer className="bg-stone-50 px-5 py-10 text-center text-sm text-stone-500">
        <p>
          Authentic Kitchen is a marketplace, not a food producer. Each
          cook is independently approved and responsible for their
          dishes.
        </p>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-700 text-base font-semibold text-white">
        {n}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{body}</p>
    </div>
  );
}
