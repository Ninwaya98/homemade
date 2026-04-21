import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CreateShopForm } from "./create-shop-form";

export const metadata = { title: "Create shop — HomeMade Admin" };

export default async function NewSellerForUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireRole("admin");
  const { userId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const [{ data: profile }, { data: existingSeller }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, location")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("seller_profiles").select("id").eq("id", userId).maybeSingle(),
  ]);

  if (!profile) notFound();
  if (existingSeller) {
    // Already a seller — bounce to their existing detail page.
    redirect(`/admin/sellers/${userId}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/sellers/new"
        className="text-sm text-stone-400 transition hover:text-violet-600"
      >
        &larr; Pick a different user
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">Create shop</h1>
        <p className="mt-1 text-sm text-stone-500">
          Setting up a shop for <span className="font-medium text-stone-800">{profile.full_name}</span>.
          Shop is created in <span className="font-medium">approved</span> status — the owner can start
          adding products immediately.
        </p>
      </div>

      <CreateShopForm
        userId={userId}
        ownerName={profile.full_name}
        initialPhone={profile.phone ?? ""}
        initialLocation={profile.location ?? ""}
      />
    </div>
  );
}
