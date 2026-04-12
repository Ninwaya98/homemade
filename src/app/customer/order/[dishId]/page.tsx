import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { nextNDays, isoDow } from "@/lib/constants";
import { OrderForm } from "./order-form";
import type { WeeklySchedule } from "@/lib/types";

export const metadata = {
  title: "Order -- HomeMade",
};

export default async function OrderDishPage({
  params,
}: {
  params: Promise<{ dishId: string }>;
}) {
  await requireAuth();
  const { dishId } = await params;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dish } = await (supabase.from("dishes") as any)
    .select(
      `
      *,
      cook_profiles!inner(id, status, photo_url, weekly_schedule, is_available,
        profiles!cook_profiles_id_fkey!inner(full_name, location))
      `,
    )
    .eq("id", dishId)
    .eq("status", "active")
    .maybeSingle();

  if (!dish || !dish.cook_profiles || dish.cook_profiles.status !== "approved") {
    notFound();
  }

  const cook = dish.cook_profiles as {
    id: string;
    photo_url: string | null;
    weekly_schedule: WeeklySchedule | null;
    is_available: boolean;
    profiles: { full_name?: string; location?: string | null };
  };

  // If cook is not available, show no days
  if (!cook.is_available) {
    return (
      <div className="space-y-6">
        <Link
          href={`/customer/cooks/${cook.id}`}
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          &larr; Back to cook
        </Link>
        <OrderForm
          dish={{
            id: dish.id,
            name: dish.name,
            description: dish.description,
            photo_url: dish.photo_url,
            price_cents: dish.price_cents,
            allergens: dish.allergens,
            portion_sizes: dish.portion_sizes ?? null,
          }}
          cook={{
            id: cook.id,
            full_name: cook.profiles.full_name ?? "--",
            location: cook.profiles.location ?? null,
            photo_url: cook.photo_url,
          }}
          availability={[]}
          unavailableMessage="This cook is currently not taking orders."
        />
      </div>
    );
  }

  // Compute availability for next 7 days from weekly_schedule template.
  // Existing availability rows (with portions_taken) take precedence.
  const dates = nextNDays(7);
  const { data: existingRows } = await supabase
    .from("availability")
    .select("*")
    .eq("cook_id", dish.cook_id)
    .in("date", dates);

  const existingByDate = (existingRows ?? []).reduce(
    (acc, row) => { acc[row.date] = row; return acc; },
    {} as Record<string, { date: string; is_open: boolean; mode: string; max_portions: number; portions_taken: number }>,
  );

  const schedule = cook.weekly_schedule;
  const availabilityDays: { date: string; mode: "preorder" | "on_demand"; left: number }[] = [];

  for (const date of dates) {
    const existing = existingByDate[date];
    if (existing) {
      // Use actual availability row (has real portions_taken)
      if (existing.is_open) {
        availabilityDays.push({
          date,
          mode: existing.mode as "preorder" | "on_demand",
          left: existing.max_portions - existing.portions_taken,
        });
      }
    } else if (schedule) {
      // Derive from weekly template
      const dow = isoDow(date);
      const dayConfig = schedule[String(dow) as keyof WeeklySchedule];
      if (dayConfig?.is_open) {
        availabilityDays.push({
          date,
          mode: dayConfig.mode,
          left: dayConfig.max_portions,
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/customer/cooks/${cook.id}`}
        className="text-sm text-stone-500 hover:text-stone-800"
      >
        &larr; Back to cook
      </Link>

      <OrderForm
        dish={{
          id: dish.id,
          name: dish.name,
          description: dish.description,
          photo_url: dish.photo_url,
          price_cents: dish.price_cents,
          allergens: dish.allergens,
          portion_sizes: dish.portion_sizes ?? null,
        }}
        cook={{
          id: cook.id,
          full_name: cook.profiles.full_name ?? "--",
          location: cook.profiles.location ?? null,
          photo_url: cook.photo_url,
        }}
        availability={availabilityDays}
      />
    </div>
  );
}
