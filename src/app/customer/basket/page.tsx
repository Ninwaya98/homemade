import { requireAuth } from "@/lib/auth";
import { BasketContent } from "./basket-content";

export const metadata = { title: "Basket -- HomeMade" };

export default async function BasketPage() {
  await requireAuth();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">Your basket</h1>
        <p className="mt-1 text-sm text-stone-500">
          Review your items, then place your orders.
        </p>
      </header>
      <BasketContent />
    </div>
  );
}
