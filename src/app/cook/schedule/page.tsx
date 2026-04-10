import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCookProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ScheduleForm } from "./schedule-form";
import { nextNDays } from "@/lib/constants";

export const metadata = {
  title: "Schedule — HomeMade",
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { profile } = await requireCookProfile();
  const supabase = await createClient();

  const { data: cp } = await supabase
    .from("cook_profiles")
    .select("status")
    .eq("id", profile.id)
    .single();
  if (!cp || cp.status !== "approved") redirect("/cook");

  const dates = nextNDays(7);
  const { data: existing } = await supabase
    .from("availability")
    .select("*")
    .eq("cook_id", profile.id)
    .in("date", dates);

  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">
          This week&apos;s schedule
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Tap the days you&apos;re open. Set how many portions and whether
          orders close 24 hours ahead (Pre-order) or in real time (On-demand).
        </p>
      </header>

      {sp.saved && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-900">Schedule saved.</p>
        </Card>
      )}

      <ScheduleForm
        dates={dates}
        existing={(existing ?? []).reduce(
          (acc, row) => {
            acc[row.date] = {
              is_open: row.is_open,
              mode: row.mode,
              max_portions: row.max_portions,
              portions_taken: row.portions_taken,
            };
            return acc;
          },
          {} as Record<
            string,
            {
              is_open: boolean;
              mode: "preorder" | "on_demand";
              max_portions: number;
              portions_taken: number;
            }
          >,
        )}
      />
    </div>
  );
}
