"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

import { approveCook, rejectCook, getCertificateSignedUrl } from "./actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type CookForReview = {
  id: string;
  bio: string;
  cuisine_tags: string[];
  certification_url: string | null;
  photo_url: string | null;
  created_at: string;
  full_name: string;
  phone: string | null;
  location: string | null;
};

export function CookApprovalRow({ cook }: { cook: CookForReview }) {
  const [pending, startTransition] = useTransition();
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const openCertificate = async () => {
    if (!cook.certification_url) return;
    const url = await getCertificateSignedUrl(cook.certification_url);
    if (url) {
      setCertUrl(url);
      window.open(url, "_blank", "noopener");
    }
  };

  const onApprove = () => {
    setBusy("approve");
    startTransition(async () => {
      await approveCook(cook.id);
      setBusy(null);
    });
  };
  const onReject = () => {
    if (!confirm(`Reject ${cook.full_name}? Their dishes won't be visible.`)) return;
    setBusy("reject");
    startTransition(async () => {
      await rejectCook(cook.id);
      setBusy(null);
    });
  };

  return (
    <Card>
      <div className="flex items-start gap-4">
        {cook.photo_url ? (
          <Image
            src={cook.photo_url}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-200 text-lg font-semibold text-stone-500">
            {cook.full_name[0]?.toUpperCase() ?? "?"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-stone-900">{cook.full_name}</h3>
            <Badge tone="amber">pending</Badge>
            <span className="text-xs text-stone-500">
              applied {new Date(cook.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {cook.location ?? "—"} · {cook.phone ?? "—"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {cook.cuisine_tags.map((t) => (
              <Badge key={t} tone="neutral">
                {t}
              </Badge>
            ))}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">
            {cook.bio || <em className="text-stone-400">No bio</em>}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={openCertificate}
          disabled={!cook.certification_url}
        >
          {certUrl ? "Re-open certificate" : "View certificate"}
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onReject}
            disabled={pending}
          >
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onApprove}
            disabled={pending}
          >
            {busy === "approve" ? "Approving…" : "Approve"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
