import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function LandingPage() {
  const profile = await getCurrentProfile();

  // Admins go to their dashboard, everyone else to the feed
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  redirect("/customer");
}
