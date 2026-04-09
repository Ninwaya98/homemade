"use client";

import { useTransition } from "react";

import { cancelOrder } from "@/app/customer/actions";
import { Button } from "@/components/ui/Button";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="danger"
      size="md"
      fullWidth
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancel this order? Your portions will be refunded.")) return;
        start(async () => {
          await cancelOrder(orderId);
        });
      }}
    >
      {pending ? "Cancelling…" : "Cancel order"}
    </Button>
  );
}
