import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Seller approvals — HomeMade Admin",
};

export default async function AdminIndexPage() {
  await requireRole("admin");
  redirect("/admin/sellers");
}
