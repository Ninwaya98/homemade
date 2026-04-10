import Link from "next/link";

export const metadata = {
  title: "HomeMade — Real food & handmade goods",
};

export default async function CustomerHomePage() {

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
          className="group card-hover overflow-hidden rounded-3xl glass-strong"
        >
          <div className="bg-gradient-to-br from-sky-100 to-blue-200 px-6 pt-8 pb-6">
            <span className="text-4xl">🍽</span>
            <h2 className="mt-3 text-xl font-bold text-sky-900">
              HomeMade Kitchen
            </h2>
            <p className="mt-1 text-sm text-sky-700/80">
              Home-cooked food from approved cooks near you
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-stone-600">
              Fresh homemade meals, daily menus, pre-order or on-demand.
              Every dish lists allergens up front.
            </p>
            <p className="mt-3 text-sm font-semibold text-violet-600 group-hover:text-violet-700">
              Browse cooks &rarr;
            </p>
          </div>
        </Link>

        {/* Market door */}
        <Link
          href="/customer/market"
          className="group card-hover overflow-hidden rounded-3xl glass-strong"
        >
          <div className="bg-gradient-to-br from-violet-100 to-purple-200 px-6 pt-8 pb-6">
            <span className="text-4xl">🛍</span>
            <h2 className="mt-3 text-xl font-bold text-violet-900">
              HomeMade Market
            </h2>
            <p className="mt-1 text-sm text-violet-700/80">
              Handmade goods from local artisans and makers
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-stone-600">
              Crafts, clothing, home decor, and packaged food products —
              all handmade by people in your area.
            </p>
            <p className="mt-3 text-sm font-semibold text-violet-600 group-hover:text-violet-700">
              Browse sellers &rarr;
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
