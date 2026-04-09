"use client";

import { useTransition } from "react";

import { setDishStatus, deleteDish } from "@/app/cook/actions";
import type { DishStatus } from "@/lib/types";

export function DishStatusToggle({
  dishId,
  status,
}: {
  dishId: string;
  status: DishStatus;
}) {
  const [pending, start] = useTransition();

  const onPause = () =>
    start(async () => {
      await setDishStatus(dishId, status === "paused" ? "active" : "paused");
    });

  const onDelete = () => {
    if (!confirm("Delete this dish? This can't be undone.")) return;
    start(async () => {
      await deleteDish(dishId);
    });
  };

  return (
    <div className="flex gap-2 text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={onPause}
        className="rounded-full border border-stone-300 px-3 py-1 text-stone-700 hover:bg-stone-100 disabled:opacity-50"
      >
        {status === "paused" ? "Resume" : "Pause"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onDelete}
        className="rounded-full border border-red-200 px-3 py-1 text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
