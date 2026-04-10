import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { formatPrice, allergenLabel } from "@/lib/constants";
import { DishStatusToggle } from "./dish-status-toggle";

export const metadata = {
  title: "Dishes — HomeMade",
};

export default async function DishesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const profile = await requireRole("cook");
  const supabase = await createClient();

  const { data: cookProfile } = await supabase
    .from("cook_profiles")
    .select("status")
    .eq("id", profile.id)
    .single();

  if (!cookProfile || cookProfile.status !== "approved") {
    redirect("/cook");
  }

  const { data: dishes } = await supabase
    .from("dishes")
    .select("*")
    .eq("cook_id", profile.id)
    .order("created_at", { ascending: false });

  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Dishes</h1>
          <p className="mt-1 text-sm text-stone-600">
            What you&apos;re cooking. Allergens are mandatory on every dish.
          </p>
        </div>
        <LinkButton href="/cook/dishes/new">+ New dish</LinkButton>
      </header>

      {(sp.created || sp.updated) && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-900">
            {sp.created ? "Dish created." : "Dish updated."}
          </p>
        </Card>
      )}

      {dishes && dishes.length > 0 ? (
        <div className="space-y-4">
          {dishes.map((dish) => (
            <Card key={dish.id}>
              <div className="flex items-start gap-4">
                {dish.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dish.photo_url}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400">
                    no photo
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-stone-900">{dish.name}</h3>
                    <Badge
                      tone={
                        dish.status === "active"
                          ? "green"
                          : dish.status === "sold_out"
                          ? "amber"
                          : "neutral"
                      }
                    >
                      {dish.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-stone-700">
                    {formatPrice(dish.price_cents)}
                    {dish.portion_size && ` · ${dish.portion_size}`}
                  </p>
                  {dish.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                      {dish.description}
                    </p>
                  )}
                  {dish.allergens.length > 0 ? (
                    <p className="mt-2 text-xs text-stone-500">
                      Contains: {dish.allergens.map(allergenLabel).join(", ")}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-stone-500">
                      No declared allergens
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
                <DishStatusToggle dishId={dish.id} status={dish.status} />
                <LinkButton
                  href={`/cook/dishes/${dish.id}`}
                  variant="secondary"
                  size="sm"
                >
                  Edit
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No dishes yet"
          body="Add your first dish so customers can order from you."
          action={
            <LinkButton href="/cook/dishes/new">Add a dish</LinkButton>
          }
        />
      )}
    </div>
  );
}
