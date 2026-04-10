import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { OrderForm } from "./order-form";

export const metadata = {
  title: "Order — HomeMade",
};

export default async function OrderDishPage({
  params,
}: {
  params: Promise<{ dishId: string }>;
}) {
  await requireAuth();
  const { dishId } = await params;
  const supabase = await createClient();

  const { data: dish } = await supabase
    .from("dishes")
    .select(
      `
      *,
      cook_profiles!inner(id, status, photo_url, profiles!cook_profiles_id_fkey!inner(full_name, location))
      `,
    )
    .eq("id", dishId)
    .eq("status", "active")
    .maybeSingle();

  if (!dish || !dish.cook_profiles || dish.cook_profiles.status !== "approved") {
    notFound();
  }

  // Fetch upcoming open days for the cook (next 7).
  const today = new Date().toISOString().slice(0, 10);
  const { data: availability } = await supabase
    .from("availability")
    .select("*")
    .eq("cook_id", dish.cook_id)
    .gte("date", today)
    .eq("is_open", true)
    .order("date", { ascending: true })
    .limit(7);

  const cook = dish.cook_profiles as {
    id: string;
    photo_url: string | null;
    profiles: { full_name?: string; location?: string | null };
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/customer/cooks/${cook.id}`}
        className="text-sm text-stone-500 hover:text-stone-800"
      >
        ← Back to cook
      </Link>

      <OrderForm
        dish={{
          id: dish.id,
          name: dish.name,
          description: dish.description,
          photo_url: dish.photo_url,
          price_cents: dish.price_cents,
          portion_size: dish.portion_size,
          allergens: dish.allergens,
        }}
        cook={{
          full_name: cook.profiles.full_name ?? "—",
          location: cook.profiles.location ?? null,
          photo_url: cook.photo_url,
        }}
        availability={(availability ?? []).map((a) => ({
          date: a.date,
          mode: a.mode,
          left: a.max_portions - a.portions_taken,
        }))}
      />
    </div>
  );
}
