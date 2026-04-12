"use client";

import { useState } from "react";

import { saveWeeklySchedule } from "@/app/cook/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DEFAULT_DAILY_PORTION_CAP } from "@/lib/constants";
import type { WeeklySchedule, WeeklyDayConfig } from "@/lib/types";

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun display order

export function ScheduleForm({
  schedule,
  dayNames,
}: {
  schedule: WeeklySchedule;
  dayNames: string[];
}) {
  const [days, setDays] = useState<Record<string, WeeklyDayConfig>>(() => {
    const out: Record<string, WeeklyDayConfig> = {};
    for (const dow of DOW_ORDER) {
      const key = String(dow);
      out[key] = schedule[key as keyof WeeklySchedule] ?? {
        is_open: false,
        mode: "preorder",
        max_portions: DEFAULT_DAILY_PORTION_CAP,
      };
    }
    return out;
  });

  function update(key: string, patch: Partial<WeeklyDayConfig>) {
    setDays((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  return (
    <form action={saveWeeklySchedule} className="space-y-4">
      {DOW_ORDER.map((dow) => {
        const key = String(dow);
        const day = days[key];
        return (
          <Card key={key}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-stone-900">
                {dayNames[dow]}
              </h3>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name={`open_${key}`}
                  checked={day.is_open}
                  onChange={(e) => update(key, { is_open: e.target.checked })}
                  className="h-5 w-5 rounded border-stone-400 text-violet-600 focus:ring-violet-500"
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
                      onClick={() => update(key, { mode: "preorder" })}
                      className={`rounded-full px-3 py-1 ${
                        day.mode === "preorder"
                          ? "bg-violet-600 text-white"
                          : "text-stone-700"
                      }`}
                    >
                      Pre-order
                    </button>
                    <button
                      type="button"
                      onClick={() => update(key, { mode: "on_demand" })}
                      className={`rounded-full px-3 py-1 ${
                        day.mode === "on_demand"
                          ? "bg-violet-600 text-white"
                          : "text-stone-700"
                      }`}
                    >
                      On-demand
                    </button>
                  </div>
                  <input type="hidden" name={`mode_${key}`} value={day.mode} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600">
                    Max portions
                  </label>
                  <input
                    type="number"
                    name={`portions_${key}`}
                    value={day.max_portions}
                    min={1}
                    max={50}
                    onChange={(e) =>
                      update(key, { max_portions: Number(e.target.value) })
                    }
                    className="mt-1 block w-24 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-base text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
                  />
                </div>
              </div>
            )}

            {!day.is_open && (
              <>
                <input type="hidden" name={`mode_${key}`} value={day.mode} />
                <input type="hidden" name={`portions_${key}`} value={day.max_portions} />
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

      <p className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900">
        <strong>Pre-order</strong> means orders for that day close 24 hours
        before. <strong>On-demand</strong> means customers can order until
        you sell out. This schedule repeats every week automatically.
      </p>
    </form>
  );
}
