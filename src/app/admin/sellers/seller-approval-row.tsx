"use client";

import { useTransition } from "react";

import { approveSeller, rejectSeller } from "@/app/admin/actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { productCategoryLabel } from "@/lib/constants";

type Seller = {
  id: string;
  shop_name: string;
  shop_description: string | null;
  category: string;
  photo_url: string | null;
  created_at: string;
  profiles: { full_name?: string; phone?: string | null; location?: string | null };
};

export function SellerApprovalRow({ seller }: { seller: Seller }) {
  const [pending, start] = useTransition();

  const handleApprove = () =>
    start(async () => {
      await approveSeller(seller.id);
    });

  const handleReject = () => {
    if (!confirm(`Reject ${seller.shop_name}?`)) return;
    start(async () => {
      await rejectSeller(seller.id);
    });
  };

  return (
    <Card>
      <div className="flex items-start gap-4">
        {seller.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={seller.photo_url}
            alt=""
            className="h-16 w-16 flex-none rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-stone-100 text-xl font-bold text-stone-600">
            {seller.shop_name[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-stone-900">{seller.shop_name}</h3>
            <Badge tone="neutral">{productCategoryLabel(seller.category)}</Badge>
            <Badge tone="amber">
              {new Date(seller.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Badge>
          </div>
          <p className="text-sm text-stone-600">
            by {seller.profiles.full_name} · {seller.profiles.location ?? "—"}
          </p>
          {seller.profiles.phone && (
            <p className="text-xs text-stone-500">{seller.profiles.phone}</p>
          )}
          {seller.shop_description && (
            <p className="mt-2 text-sm text-stone-600 line-clamp-3">{seller.shop_description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="danger" size="sm" disabled={pending} onClick={handleReject}>
          Reject
        </Button>
        <Button type="button" size="sm" disabled={pending} onClick={handleApprove}>
          {pending ? "Processing…" : "Approve"}
        </Button>
      </div>
    </Card>
  );
}
