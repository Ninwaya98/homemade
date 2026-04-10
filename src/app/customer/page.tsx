import Link from "next/link";

import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "HomeMade — Real food & handmade goods",
};

export default async function CustomerHomePage() {
  await requireRole("customer");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">
          What are you looking for?
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Choose a section to start browsing
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Kitchen door */}
        <Link
          href="/customer/kitchen"
          className="group card-hover overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
        >
          <div className="gradient-hero px-6 pt-8 pb-6">
            <span className="text-4xl">🍽</span>
            <h2 className="mt-3 text-xl font-bold text-white">
              HomeMade Kitchen
            </h2>
            <p className="mt-1 text-sm text-amber-200/80">
              Home-cooked food from approved cooks near you
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-stone-600">
              Fresh homemade meals, daily menus, pre-order or on-demand.
              Every dish lists allergens up front.
            </p>
            <p className="mt-3 text-sm font-semibold text-amber-700 group-hover:text-amber-800">
              Browse cooks &rarr;
            </p>
          </div>
        </Link>

        {/* Market door */}
        <Link
          href="/customer/market"
          className="group card-hover overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
        >
          <div className="bg-gradient-to-br from-stone-800 to-stone-900 px-6 pt-8 pb-6">
            <span className="text-4xl">🛍</span>
            <h2 className="mt-3 text-xl font-bold text-white">
              HomeMade Market
            </h2>
            <p className="mt-1 text-sm text-stone-300">
              Handmade goods from local artisans and makers
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-stone-600">
              Crafts, clothing, home decor, and packaged food products —
              all handmade by people in your area.
            </p>
            <p className="mt-3 text-sm font-semibold text-amber-700 group-hover:text-amber-800">
              Browse sellers &rarr;
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
