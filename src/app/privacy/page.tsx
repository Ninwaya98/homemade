import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — HomeMade",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <Link
        href="/"
        className="text-sm text-violet-600 hover:text-violet-700"
      >
        &larr; Back to home
      </Link>

      <h1 className="mt-6 text-3xl font-semibold text-stone-900">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-stone-500">Last updated: April 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-700">
        <section>
          <h2 className="text-lg font-semibold text-stone-900">1. Data We Collect</h2>
          <p>
            When you create an account, we collect your name, email address,
            and role (cook or customer). Cooks additionally provide a phone
            number, location, bio, cuisine tags, a food handler certificate,
            and an optional photo. Order and review data is stored to operate
            the marketplace.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">2. How We Use Your Data</h2>
          <p>
            Your data is used to: operate the marketplace and facilitate
            orders; display cook profiles to customers; enable reviews and
            ratings; communicate order updates; comply with legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">3. Data Sharing</h2>
          <p>
            We share your data only as necessary: cook names, photos,
            locations, and bios are publicly visible to customers. Phone
            numbers are shared with customers who place orders. Certificates
            are visible only to platform administrators. We do not sell your
            data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">4. Data Storage</h2>
          <p>
            Your data is stored securely using Supabase (hosted on AWS).
            Passwords are hashed and never stored in plain text. Files
            (certificates, photos) are stored in encrypted cloud storage
            buckets with appropriate access controls.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">5. Your Rights</h2>
          <p>
            You have the right to: access your personal data; correct
            inaccurate data; delete your account and associated data; export
            your data. To exercise these rights, contact us or use the
            account deletion feature in the app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">6. Cookies</h2>
          <p>
            We use essential cookies to maintain your login session. We do not
            use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">7. Changes</h2>
          <p>
            We may update this policy at any time. We will notify registered
            users of material changes via email.
          </p>
        </section>
      </div>
    </main>
  );
}
