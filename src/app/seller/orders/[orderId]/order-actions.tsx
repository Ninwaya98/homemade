"use client";

import { useState, useTransition } from "react";

import { setSellerOrderStatus } from "@/app/seller/actions";
import { Button } from "@/components/ui/Button";

export function SellerOrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [pending, start] = useTransition();
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [readyTime, setReadyTime] = useState("");

  const run = (next: "confirmed" | "ready" | "completed" | "cancelled", estTime?: string) =>
    start(async () => {
      await setSellerOrderStatus(orderId, next, estTime);
    });

  if (status === "pending") {
    return (
      <div className="space-y-3">
        {showTimeInput && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <label className="block text-sm font-medium text-violet-900">
              Estimated ready time (optional)
            </label>
            <input
              type="time"
              value={readyTime}
              onChange={(e) => setReadyTime(e.target.value)}
              className="mt-2 rounded-lg border border-violet-300 bg-white px-3 py-2 text-base outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
            />
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowTimeInput(false)}>
                Skip
              </Button>
              <Button type="button" size="sm" disabled={pending} onClick={() => run("confirmed", readyTime || undefined)}>
                {pending ? "Confirming…" : "Confirm order"}
              </Button>
            </div>
          </div>
        )}
        {!showTimeInput && (
          <div className="flex gap-2">
            <Button type="button" variant="danger" size="md" disabled={pending}
              onClick={() => { if (confirm("Cancel this order?")) run("cancelled"); }}>
              Cancel
            </Button>
            <Button type="button" size="md" fullWidth disabled={pending} onClick={() => setShowTimeInput(true)}>
              Confirm order
            </Button>
          </div>
        )}
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <div className="flex gap-2">
        <Button type="button" variant="danger" size="md" disabled={pending}
          onClick={() => { if (confirm("Cancel this confirmed order?")) run("cancelled"); }}>
          Cancel
        </Button>
        <Button type="button" size="md" fullWidth disabled={pending} onClick={() => run("ready")}>
          Mark as ready
        </Button>
      </div>
    );
  }
  if (status === "ready") {
    return (
      <Button type="button" size="md" fullWidth disabled={pending} onClick={() => run("completed")}>
        Mark as collected / delivered
      </Button>
    );
  }
  return null;
}
