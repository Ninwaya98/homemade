"use client";

import { useTransition } from "react";

import { cancelProductOrder } from "@/app/customer/actions";
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
        if (!confirm("Cancel this order? Your stock will be restored.")) return;
        start(async () => {
          await cancelProductOrder(orderId);
        });
      }}
    >
      {pending ? "Cancelling…" : "Cancel order"}
    </Button>
  );
}
