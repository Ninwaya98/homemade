"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { approveResolution, rejectResolution } from "@/app/admin/actions";

export function AdminReviewActions({ reviewId }: { reviewId: string }) {
  const [pending, start] = useTransition();

  const approve = () => {
    start(async () => {
      await approveResolution(reviewId);
    });
  };

  const reject = () => {
    start(async () => {
      await rejectResolution(reviewId);
    });
  };

  return (
    <>
      <Button type="button" size="sm" variant="danger" disabled={pending} onClick={reject}>
        {pending ? "..." : "Reject"}
      </Button>
      <Button type="button" size="sm" disabled={pending} onClick={approve}>
        {pending ? "..." : "Approve resolution"}
      </Button>
    </>
  );
}
