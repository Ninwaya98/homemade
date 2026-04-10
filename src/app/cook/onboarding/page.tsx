import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export const metadata = {
  title: "Set up your kitchen — HomeMade",
};

export default async function OnboardingPage() {
  const profile = await requireRole("cook");
  const supabase = await createClient();

  const { data: cookProfile } = await supabase
    .from("cook_profiles")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle();

  // Already approved? No reason to be on this page.
  if (cookProfile?.status === "approved") {
    redirect("/cook");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">
          Set up your kitchen
        </h1>
        <p className="mt-2 text-stone-600">
          A few details so customers can find you and our team can verify
          your kitchen. We&apos;ll review within 1–2 days.
        </p>
      </header>

      <OnboardingForm
        defaultBio={cookProfile?.bio ?? ""}
        defaultCuisineTags={cookProfile?.cuisine_tags ?? []}
        defaultPhone={profile.phone ?? ""}
        defaultLocation={profile.location ?? ""}
        hasCertificate={!!cookProfile?.certification_url}
        currentPhotoUrl={cookProfile?.photo_url ?? null}
      />
    </div>
  );
}
