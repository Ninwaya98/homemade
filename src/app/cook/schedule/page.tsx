import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCookProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ScheduleForm } from "./schedule-form";
import type { WeeklySchedule } from "@/lib/types";

export const metadata = {
  title: "Schedule -- HomeMade",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { profile } = await requireCookProfile();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cp } = await (supabase.from("cook_profiles") as any)
    .select("status, weekly_schedule")
    .eq("id", profile.id)
    .single();
  if (!cp || cp.status !== "approved") redirect("/cook");

  const schedule: WeeklySchedule = cp.weekly_schedule ?? {};
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">
          Weekly schedule
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Set your recurring weekly availability. This repeats every week
          automatically -- no need to update it each week.
        </p>
      </header>

      {sp.saved && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-900">Schedule saved.</p>
        </Card>
      )}

      <ScheduleForm
        schedule={schedule}
        dayNames={DAY_NAMES}
      />
    </div>
  );
}
