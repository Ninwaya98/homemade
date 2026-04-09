"use client";

import { useTransition } from "react";

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
  const run = (next: "confirmed" | "ready" | "completed" | "cancelled") =>
    start(async () => {
      await setOrderStatus(orderId, next);
    });

  if (status === "pending") {
    return (
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
          onClick={() => run("confirmed")}
        >
          Confirm order
        </Button>
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
