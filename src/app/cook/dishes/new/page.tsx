import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { DishForm } from "../dish-form";

export const metadata = {
  title: "New dish — Authentic Kitchen",
};

export default async function NewDishPage() {
  const profile = await requireRole("cook");
  const supabase = await createClient();
  const { data: cp } = await supabase
    .from("cook_profiles")
    .select("status")
    .eq("id", profile.id)
    .single();
  if (!cp || cp.status !== "approved") redirect("/cook");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">New dish</h1>
        <p className="mt-1 text-sm text-stone-600">
          Customers see allergens on the dish card AND again at checkout.
        </p>
      </header>
      <DishForm mode="create" />
    </div>
  );
}
