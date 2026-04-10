import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { allergenLabel, formatPrice, dayLabel } from "@/lib/constants";

export const metadata = {
  title: "Cook profile — HomeMade",
};

export default async function CookProfilePage({
  params,
}: {
  params: Promise<{ cookId: string }>;
}) {
  await requireRole("customer");
  const { cookId } = await params;
  const supabase = await createClient();

  const { data: cook } = await supabase
    .from("cook_profiles")
    .select(
      `
      *,
      profiles!cook_profiles_id_fkey!inner(full_name, location)
      `,
    )
    .eq("id", cookId)
    .eq("status", "approved")
    .maybeSingle();

  if (!cook) notFound();
  const profile = cook.profiles as { full_name?: string; location?: string | null };

  const { data: dishes } = await supabase
    .from("dishes")
    .select("*")
    .eq("cook_id", cookId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const { data: availability } = await supabase
    .from("availability")
    .select("*")
    .eq("cook_id", cookId)
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(7);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profiles!reviews_reviewer_id_fkey(full_name)")
    .eq("reviewee_id", cookId)
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <Link
        href="/customer"
        className="text-sm text-stone-500 hover:text-stone-800"
      >
        ← Back to feed
      </Link>

      {/* Hero */}
      <Card>
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          {cook.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cook.photo_url}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 text-3xl font-semibold text-amber-700">
              {profile.full_name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-stone-900">
              {profile.full_name}
            </h1>
            <p className="text-sm text-stone-500">
              {profile.location ?? "—"}
              {cook.rating_count > 0 && (
                <> · ⭐ {Number(cook.avg_rating).toFixed(1)} ({cook.rating_count} reviews)</>
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {cook.cuisine_tags.map((t) => (
                <Badge key={t} tone="neutral">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {cook.bio && (
          <p className="mt-5 whitespace-pre-wrap text-sm text-stone-700">
            {cook.bio}
          </p>
        )}
      </Card>

      {/* Open days */}
      {availability && availability.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-stone-900">
            Open this week
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {availability.filter((a) => a.is_open).map((a) => (
              <Badge
                key={a.id}
                tone={a.portions_taken >= a.max_portions ? "red" : "green"}
              >
                {dayLabel(a.date)} · {a.max_portions - a.portions_taken} left
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Dishes */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-stone-900">
          On the menu
        </h2>
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
                      className="h-24 w-24 flex-none rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 flex-none rounded-lg bg-stone-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-stone-900">{dish.name}</h3>
                    <p className="text-sm font-medium text-stone-700">
                      {formatPrice(dish.price_cents)}
                      {dish.portion_size && ` · ${dish.portion_size}`}
                    </p>
                    {dish.description && (
                      <p className="mt-1 text-sm text-stone-600">{dish.description}</p>
                    )}
                    {dish.allergens.length > 0 && (
                      <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900">
                        Contains: {dish.allergens.map(allergenLabel).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <LinkButton
                    href={`/customer/order/${dish.id}`}
                    size="sm"
                  >
                    Order
                  </LinkButton>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing on the menu yet" />
        )}
      </section>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-stone-900">Recent reviews</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-900">
                    {(r.profiles as { full_name?: string } | null)?.full_name ?? "Customer"}
                  </p>
                  <span className="text-sm text-amber-600">
                    {"⭐".repeat(r.rating)}
                  </span>
                </div>
                {r.text && <p className="mt-2 text-sm text-stone-700">{r.text}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
