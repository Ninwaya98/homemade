import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { SellerOnboardingForm } from "./onboarding-form";

export const metadata = {
  title: "Set up your shop — HomeMade Market",
};

export default async function SellerOnboardingPage() {
  const profile = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: sellerProfile } = await supabase
    .from("seller_profiles")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle();

  if (sellerProfile?.status === "approved") {
    redirect("/seller");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">
          Set up your shop
        </h1>
        <p className="mt-2 text-stone-600">
          A few details so customers can find you and our team can approve
          your shop. We&apos;ll review within 1–2 days.
        </p>
      </header>

      <SellerOnboardingForm
        defaultShopName={sellerProfile?.shop_name ?? ""}
        defaultShopDescription={sellerProfile?.shop_description ?? ""}
        defaultCategory={sellerProfile?.category ?? ""}
        defaultPhone={profile.phone ?? ""}
        defaultLocation={profile.location ?? ""}
        currentPhotoUrl={sellerProfile?.photo_url ?? null}
      />
    </div>
  );
}
