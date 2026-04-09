import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { DishForm } from "../dish-form";

export const metadata = {
  title: "Edit dish — Authentic Kitchen",
};

export default async function EditDishPage({
  params,
}: {
  params: Promise<{ dishId: string }>;
}) {
  const { dishId } = await params;
  const profile = await requireRole("cook");
  const supabase = await createClient();

  const { data: dish } = await supabase
    .from("dishes")
    .select("*")
    .eq("id", dishId)
    .eq("cook_id", profile.id)
    .maybeSingle();

  if (!dish) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">Edit dish</h1>
      </header>
      <DishForm
        mode="edit"
        dishId={dish.id}
        defaultValues={{
          name: dish.name,
          description: dish.description ?? "",
          price: dish.price_cents / 100,
          portion_size: dish.portion_size ?? "",
          cuisine_tag: dish.cuisine_tag ?? "",
          allergens: dish.allergens ?? [],
          photo_url: dish.photo_url ?? null,
        }}
      />
    </div>
  );
}
