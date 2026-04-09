"use client";

import { useState, useTransition } from "react";

import { leaveReview } from "@/app/customer/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ReviewForm({
  orderId,
  existing,
}: {
  orderId: string;
  existing: { rating: number; text: string | null } | null;
}) {
  const [rating, setRating] = useState<number>(existing?.rating ?? 0);
  const [text, setText] = useState<string>(existing?.text ?? "");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState(false);

  const submit = () => {
    if (rating < 1) return;
    const fd = new FormData();
    fd.set("order_id", orderId);
    fd.set("rating", String(rating));
    fd.set("text", text);
    start(async () => {
      await leaveReview(fd);
      setDone(true);
      setEditing(false);
    });
  };

  if (done && !editing) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <p className="text-sm font-medium text-emerald-900">
          Thanks for your review.
        </p>
        <div className="mt-2 text-sm">
          <p className="text-amber-600">{"⭐".repeat(rating)}</p>
          {text && <p className="mt-1 text-stone-700">{text}</p>}
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-xs text-amber-700 hover:text-amber-800"
        >
          Edit review
        </button>
      </Card>
    );
  }

  if (existing && !editing) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <p className="text-sm font-medium text-emerald-900">
          Your review
        </p>
        <div className="mt-2 text-sm">
          <p className="text-amber-600">{"⭐".repeat(existing.rating)}</p>
          {existing.text && <p className="mt-1 text-stone-700">{existing.text}</p>}
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-xs text-amber-700 hover:text-amber-800"
        >
          Edit review
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-stone-900">How was it?</h2>
      <p className="mt-1 text-xs text-stone-500">
        Your review helps other customers find great cooks.
      </p>

      <div className="mt-4 flex gap-1 text-3xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className={n <= rating ? "text-amber-500" : "text-stone-300 hover:text-amber-300"}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="What did you love? What could be even better?"
        className="mt-4 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
      />

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          size="md"
          disabled={pending || rating === 0}
          onClick={submit}
        >
          {pending ? "Sending…" : "Send review"}
        </Button>
      </div>
    </Card>
  );
}
