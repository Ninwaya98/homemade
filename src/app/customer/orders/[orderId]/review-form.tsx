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
  existing: { sentiment: string; text: string | null } | null;
}) {
  const [sentiment, setSentiment] = useState<"like" | "dislike" | null>(
    (existing?.sentiment as "like" | "dislike") ?? null,
  );
  const [text, setText] = useState<string>(existing?.text ?? "");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState(false);

  const submit = () => {
    if (!sentiment) return;
    const fd = new FormData();
    fd.set("order_id", orderId);
    fd.set("sentiment", sentiment);
    fd.set("text", text);
    start(async () => {
      await leaveReview(fd);
      setDone(true);
      setEditing(false);
    });
  };

  // ── Completed / existing review (read mode) ──

  const readView = (s: string, t: string | null) => (
    <Card className={s === "like" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{s === "like" ? "\uD83D\uDC4D" : "\uD83D\uDC4E"}</span>
        <p className={`text-sm font-medium ${s === "like" ? "text-emerald-900" : "text-rose-900"}`}>
          {s === "like" ? "You liked this" : "You disliked this"}
        </p>
      </div>
      {t && <p className="mt-2 text-sm text-stone-700">{t}</p>}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-2 text-xs text-violet-600 hover:text-violet-700"
      >
        Edit review
      </button>
    </Card>
  );

  if (done && !editing) return readView(sentiment!, text || null);
  if (existing && !editing) return readView(existing.sentiment, existing.text);

  // ── Form mode ──

  return (
    <Card>
      <h2 className="text-base font-semibold text-stone-900">How was it?</h2>
      <p className="mt-1 text-xs text-stone-500">
        Your feedback helps the community find great cooks & sellers.
      </p>

      {/* Like / Dislike buttons */}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => setSentiment("like")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
            sentiment === "like"
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:bg-emerald-50/50"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
          </svg>
          Liked it
        </button>
        <button
          type="button"
          onClick={() => setSentiment("dislike")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
            sentiment === "dislike"
              ? "border-rose-500 bg-rose-50 text-rose-700"
              : "border-stone-200 bg-white text-stone-600 hover:border-rose-300 hover:bg-rose-50/50"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
            <path d="M17 2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3" />
          </svg>
          Didn&apos;t like it
        </button>
      </div>

      {/* Text area — appears after choosing sentiment */}
      {sentiment && (
        <div className="mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={
              sentiment === "like"
                ? "What did you enjoy? (optional)"
                : "What went wrong? (required for your feedback to count)"
            }
            className={`block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition ${
              sentiment === "like"
                ? "border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                : "border-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            }`}
          />
          {sentiment === "dislike" && !text.trim() && (
            <p className="mt-1.5 text-[11px] text-stone-400">
              A dislike without a reason is forgiven and won&apos;t affect the rating.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          size="md"
          disabled={pending || !sentiment}
          onClick={submit}
        >
          {pending ? "Sending\u2026" : "Send review"}
        </Button>
      </div>
    </Card>
  );
}
