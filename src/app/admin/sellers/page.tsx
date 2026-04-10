import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { productCategoryLabel } from "@/lib/constants";
import { SellerApprovalRow } from "./seller-approval-row";

export const metadata = {
  title: "Seller approvals — HomeMade Admin",
};

export default async function SellerApprovalsPage() {
  await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: pendingSellers } = await supabase
    .from("seller_profiles")
    .select("*, profiles!seller_profiles_id_fkey(full_name, phone, location)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Seller approvals</h1>

      {pendingSellers && pendingSellers.length > 0 ? (
        <div className="space-y-4">
          {pendingSellers.map((s: {
            id: string; shop_name: string; shop_description: string | null;
            category: string; photo_url: string | null; created_at: string;
            profiles: { full_name?: string; phone?: string | null; location?: string | null };
          }) => (
            <SellerApprovalRow key={s.id} seller={s} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No pending sellers"
          body="All caught up! New seller applications will appear here."
        />
      )}
    </div>
  );
}
