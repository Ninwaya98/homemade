import { ResetPasswordForm } from "./reset-password-form";

export const metadata = {
  title: "Choose a new password | Meso Craft",
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen gradient-mesh px-5 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="mt-6 text-3xl font-semibold text-stone-900">
          Choose a new password
        </h1>
        <p className="mt-2 text-stone-600">
          Enter it twice. You will stay signed in.
        </p>

        <ResetPasswordForm />
      </div>
    </main>
  );
}
