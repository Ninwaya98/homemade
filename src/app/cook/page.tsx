import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { dayLabel, formatPrice, todayIso } from "@/lib/constants";

export const metadata = {
  title: "My kitchen — Authentic Kitchen",
};

export default async function CookHome({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string }>;
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { onboarded } = await searchParams;

  const { data: cookProfile } = await supabase
    .from("cook_profiles")
    .select("*")
    .eq("id", profile!.id)
    .maybeSingle();

  // No cook profile yet → onboarding CTA.
  if (!cookProfile) {
    return (
      <div className="space-y-6">
        <Card>
          <h1 className="text-2xl font-semibold text-stone-900">
            Welcome to your kitchen
          </h1>
          <p className="mt-2 text-stone-600">
            One quick setup and you&apos;re cooking. We need to know who you
            are, what you cook, and to see your food handler certificate.
          </p>
          <div className="mt-5">
            <LinkButton href="/cook/onboarding" size="lg">
              Set up my kitchen
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  // Pending review.
  if (cookProfile.status === "pending") {
    return (
      <div className="space-y-6">
        {onboarded && (
          <Card className="bg-emerald-50 border-emerald-200">
            <h2 className="text-base font-semibold text-emerald-900">
              Submitted for review ✓
            </h2>
            <p className="mt-1 text-sm text-emerald-900/80">
              Thanks {profile!.full_name.split(" ")[0]} — our team will look
              at your certificate within 1–2 days.
            </p>
          </Card>
        )}
        <Card>
          <h1 className="text-2xl font-semibold text-stone-900">
            Pending admin review
          </h1>
          <p className="mt-2 text-stone-600">
            We&apos;re reviewing your food handler certificate. Once you&apos;re
            approved, your dishes can go live and customers can find you.
          </p>
          <div className="mt-5 flex gap-3">
            <LinkButton href="/cook/onboarding" variant="secondary" size="md">
              Edit my profile
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  // Suspended.
  if (cookProfile.status === "suspended") {
    return (
      <Card className="border-red-200 bg-red-50">
        <h1 className="text-xl font-semibold text-red-900">
          Your kitchen is suspended
        </h1>
        <p className="mt-2 text-sm text-red-900/80">
          Please reach out to our support team. Your dishes are not visible
          to customers right now.
        </p>
      </Card>
    );
  }

  // Approved — show today's snapshot + pending orders that need attention.
  const today = todayIso();
  const { data: todayAvailability } = await supabase
    .from("availability")
    .select("*")
    .eq("cook_id", profile!.id)
    .eq("date", today)
    .maybeSingle();

  // Pending orders for ANY date — these need the cook's attention.
  const { data: pendingOrders } = await supabase
    .from("orders")
    .select("id, quantity, status, scheduled_for, dishes(name)")
    .eq("cook_id", profile!.id)
    .eq("status", "pending")
    .order("scheduled_for", { ascending: true });

  // Today's confirmed/ready orders — what you're cooking right now.
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("id, quantity, status, dishes(name)")
    .eq("cook_id", profile!.id)
    .eq("scheduled_for", today)
    .in("status", ["confirmed", "ready"])
    .order("created_at", { ascending: true });

  const { count: totalDishes } = await supabase
    .from("dishes")
    .select("*", { count: "exact", head: true })
    .eq("cook_id", profile!.id)
    .eq("status", "active");

  return (
    <div className="space-y-6">
      {pendingOrders && pendingOrders.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <h2 className="text-base font-semibold text-amber-900">
            {pendingOrders.length} new order{pendingOrders.length === 1 ? "" : "s"} need your attention
          </h2>
          <ul className="mt-3 divide-y divide-amber-200">
            {pendingOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    {o.quantity}× {(o.dishes as { name?: string } | null)?.name ?? "—"}
                  </p>
                  <p className="text-xs text-amber-800/80">
                    for {o.scheduled_for ? dayLabel(o.scheduled_for) : "—"}
                  </p>
                </div>
                <LinkButton
                  href={`/cook/orders/${o.id}`}
                  size="sm"
                  variant="primary"
                >
                  Review
                </LinkButton>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h1 className="text-2xl font-semibold text-stone-900">
          Today, {dayLabel(today)}
        </h1>
        {todayAvailability?.is_open ? (
          <div className="mt-3">
            <p className="text-stone-700">
              You&apos;re open today. {todayAvailability.portions_taken} /{" "}
              {todayAvailability.max_portions} portions taken.
            </p>
            <Badge tone={todayAvailability.mode === "preorder" ? "blue" : "green"}>
              {todayAvailability.mode === "preorder" ? "Pre-order" : "On-demand"}
            </Badge>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-stone-700">You&apos;re closed today.</p>
            <p className="mt-1 text-sm text-stone-500">
              Open the schedule to start taking orders.
            </p>
            <div className="mt-3">
              <LinkButton href="/cook/schedule" size="sm">
                Set this week&apos;s schedule
              </LinkButton>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-stone-900">Cooking today</h2>
        {todayOrders && todayOrders.length > 0 ? (
          <ul className="mt-4 divide-y divide-stone-100">
            {todayOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {o.quantity}× {(o.dishes as { name?: string } | null)?.name ?? "—"}
                  </p>
                </div>
                <Badge
                  tone={
                    o.status === "completed"
                      ? "green"
                      : o.status === "ready"
                      ? "blue"
                      : o.status === "confirmed"
                      ? "amber"
                      : "neutral"
                  }
                >
                  {o.status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">No orders for today yet.</p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Dishes</h2>
            <p className="text-sm text-stone-500">
              {totalDishes ?? 0} active {totalDishes === 1 ? "dish" : "dishes"}
            </p>
          </div>
          <LinkButton href="/cook/dishes" variant="secondary" size="sm">
            Manage dishes
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
