"use client";

import { useState } from "react";

import { saveAvailability } from "@/app/cook/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { dayLabel, DEFAULT_DAILY_PORTION_CAP } from "@/lib/constants";

type DayState = {
  is_open: boolean;
  mode: "preorder" | "on_demand";
  max_portions: number;
  portions_taken: number;
};

export function ScheduleForm({
  dates,
  existing,
}: {
  dates: string[];
  existing: Record<string, DayState>;
}) {
  const [days, setDays] = useState<Record<string, DayState>>(() => {
    const out: Record<string, DayState> = {};
    for (const date of dates) {
      out[date] =
        existing[date] ?? {
          is_open: false,
          mode: "preorder",
          max_portions: DEFAULT_DAILY_PORTION_CAP,
          portions_taken: 0,
        };
    }
    return out;
  });

  const update = (date: string, patch: Partial<DayState>) =>
    setDays((prev) => ({ ...prev, [date]: { ...prev[date], ...patch } }));

  return (
    <form action={saveAvailability} className="space-y-4">
      <input type="hidden" name="dates" value={dates.join(",")} />
      {dates.map((date) => {
        const day = days[date];
        return (
          <Card key={date}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  {dayLabel(date)}
                </h3>
                {day.portions_taken > 0 && (
                  <p className="mt-1 text-xs text-stone-500">
                    {day.portions_taken} portion{day.portions_taken === 1 ? "" : "s"} already booked
                  </p>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name={`open_${date}`}
                  checked={day.is_open}
                  onChange={(e) => update(date, { is_open: e.target.checked })}
                  className="h-5 w-5 rounded border-stone-400 text-amber-700 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-stone-700">Open</span>
              </label>
            </div>

            {day.is_open && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-stone-600">
                    Mode
                  </label>
                  <div className="mt-1 inline-flex rounded-full border border-stone-300 bg-white p-0.5 text-sm">
                    <button
                      type="button"
                      onClick={() => update(date, { mode: "preorder" })}
                      className={`rounded-full px-3 py-1 ${
                        day.mode === "preorder"
                          ? "bg-amber-700 text-white"
                          : "text-stone-700"
                      }`}
                    >
                      Pre-order
                    </button>
                    <button
                      type="button"
                      onClick={() => update(date, { mode: "on_demand" })}
                      className={`rounded-full px-3 py-1 ${
                        day.mode === "on_demand"
                          ? "bg-amber-700 text-white"
                          : "text-stone-700"
                      }`}
                    >
                      On-demand
                    </button>
                  </div>
                  <input type="hidden" name={`mode_${date}`} value={day.mode} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600">
                    Max portions
                  </label>
                  <input
                    type="number"
                    name={`portions_${date}`}
                    value={day.max_portions}
                    min={Math.max(1, day.portions_taken)}
                    max={50}
                    onChange={(e) =>
                      update(date, { max_portions: Number(e.target.value) })
                    }
                    className="mt-1 block w-24 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-base text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </div>
            )}

            {!day.is_open && (
              <>
                <input type="hidden" name={`mode_${date}`} value={day.mode} />
                <input
                  type="hidden"
                  name={`portions_${date}`}
                  value={day.max_portions}
                />
              </>
            )}
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Save schedule
        </Button>
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <strong>Pre-order</strong> means orders for that day close 24 hours
        before. <strong>On-demand</strong> means customers can order until
        you sell out.
      </p>
    </form>
  );
}
