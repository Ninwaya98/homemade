"use client";

import { useState, useTransition } from "react";

import { setOrderStatus } from "@/app/cook/actions";
import { Button } from "@/components/ui/Button";

export function OrderActions({
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
      await setOrderStatus(orderId, next, estTime);
    });

  if (status === "pending") {
    return (
      <div className="space-y-3">
        {showTimeInput && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <label className="block text-sm font-medium text-amber-900">
              Estimated ready time (optional)
            </label>
            <p className="mt-0.5 text-xs text-amber-800/70">
              Let the customer know when their order will be ready
            </p>
            <input
              type="time"
              value={readyTime}
              onChange={(e) => setReadyTime(e.target.value)}
              className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-base outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
            />
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTimeInput(false)}
              >
                Skip
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => run("confirmed", readyTime || undefined)}
              >
                {pending ? "Confirming…" : "Confirm order"}
              </Button>
            </div>
          </div>
        )}
        {!showTimeInput && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={pending}
              onClick={() => {
                if (confirm("Cancel this order?")) run("cancelled");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="md"
              fullWidth
              disabled={pending}
              onClick={() => setShowTimeInput(true)}
            >
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
        <Button
          type="button"
          variant="danger"
          size="md"
          disabled={pending}
          onClick={() => {
            if (confirm("Cancel this confirmed order?")) run("cancelled");
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="md"
          fullWidth
          disabled={pending}
          onClick={() => run("ready")}
        >
          Mark as ready for pickup
        </Button>
      </div>
    );
  }
  if (status === "ready") {
    return (
      <Button
        type="button"
        size="md"
        fullWidth
        disabled={pending}
        onClick={() => run("completed")}
      >
        Mark as collected / delivered
      </Button>
    );
  }
  return null;
}
