"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { respondToReview } from "@/app/cook/actions";

export function ReviewResponseForm({ reviewId }: { reviewId: string }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!text.trim()) return;
    const fd = new FormData();
    fd.set("review_id", reviewId);
    fd.set("response_text", text);
    start(async () => {
      await respondToReview(fd);
      setDone(true);
    });
  };

  if (done) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs font-medium text-amber-700">
          Response submitted — pending admin approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-stone-600">
        Explain how you&apos;ve addressed this feedback:
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Describe the steps you've taken to fix this issue..."
        className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={pending || !text.trim()} onClick={submit}>
          {pending ? "Sending\u2026" : "Submit response"}
        </Button>
      </div>
    </div>
  );
}
