"use client";

import { useTransition } from "react";

import { setProductStatus, deleteProduct } from "@/app/seller/actions";
import { Button } from "@/components/ui/Button";

export function ProductStatusToggle({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {status === "active" && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => start(() => setProductStatus(productId, "paused"))}
        >
          Pause
        </Button>
      )}
      {(status === "paused" || status === "out_of_stock") && (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => start(() => setProductStatus(productId, "active"))}
        >
          Reactivate
        </Button>
      )}
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this product? Active orders will cause it to be paused instead.")) {
            start(() => deleteProduct(productId));
          }
        }}
      >
        Delete
      </Button>
    </div>
  );
}
