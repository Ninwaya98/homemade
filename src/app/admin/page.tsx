import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CookApprovalRow } from "./cook-approval-row";

export const metadata = {
  title: "Cook approvals — HomeMade Admin",
};

export default async function AdminApprovalsPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("cook_profiles")
    .select(
      "*, profiles!cook_profiles_id_fkey(full_name, phone, location, created_at)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">
          Cook approvals
        </h1>
        <p className="mt-1 text-stone-600">
          Review each cook&apos;s food handler certificate, then approve or
          suspend.
        </p>
      </header>

      {pending && pending.length > 0 ? (
        <div className="space-y-4">
          {pending.map((cook) => (
            <CookApprovalRow
              key={cook.id}
              cook={{
                id: cook.id,
                bio: cook.bio ?? "",
                cuisine_tags: cook.cuisine_tags ?? [],
                certification_url: cook.certification_url,
                photo_url: cook.photo_url,
                created_at: cook.created_at,
                full_name: (cook.profiles as { full_name?: string } | null)?.full_name ?? "—",
                phone: (cook.profiles as { phone?: string | null } | null)?.phone ?? null,
                location: (cook.profiles as { location?: string | null } | null)?.location ?? null,
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing waiting for review"
          body="When a new cook submits their kitchen, they'll show up here."
        />
      )}
    </div>
  );
}
