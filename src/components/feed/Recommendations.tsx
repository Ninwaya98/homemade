import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";

interface RecommendedProduct {
  id: string;
  name: string;
  price_cents: number;
  photo_urls: string[];
  seller_profiles: { shop_name: string };
}

export function ProductRecommendations({ products }: { products: RecommendedProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mt-8">
      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">You might also like</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/customer/market/order/${p.id}`}
            className="group glass-strong rounded-2xl overflow-hidden card-hover"
          >
            {p.photo_urls.length > 0 ? (
              <div className="relative h-28 w-full">
                <Image src={p.photo_urls[0]} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
            ) : (
              <div className="h-28 w-full bg-gradient-to-br from-stone-100 to-sky-50 dark:from-stone-800 dark:to-sky-950 flex items-center justify-center text-3xl">🛍</div>
            )}
            <div className="p-3">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:text-violet-700">{p.name}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{p.seller_profiles?.shop_name}</p>
              <p className="mt-1 text-sm font-medium text-sky-600 dark:text-sky-400">{formatPrice(p.price_cents)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
