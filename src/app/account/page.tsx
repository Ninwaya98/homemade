import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata = {
  title: "Account Settings — Authentic Kitchen",
};

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="text-2xl font-semibold text-stone-900">Account Settings</h1>
      <p className="mt-2 text-sm text-stone-600">
        Signed in as <strong>{profile.full_name}</strong>
      </p>

      <hr className="my-8 border-stone-200" />

      <section>
        <h2 className="text-lg font-semibold text-red-900">Delete Account</h2>
        <p className="mt-2 text-sm text-stone-600">
          This will permanently delete your account and all associated data
          (profile, dishes, schedule, reviews). This action cannot be undone.
          If you have active orders, you must wait until they are completed or
          cancelled first.
        </p>
        <DeleteAccountForm />
      </section>
    </main>
  );
}
