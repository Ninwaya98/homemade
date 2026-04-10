import Link from "next/link";

export const metadata = {
  title: "Terms of Service — HomeMade",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <Link
        href="/"
        className="text-sm text-amber-700 hover:text-amber-800"
      >
        &larr; Back to home
      </Link>

      <h1 className="mt-6 text-3xl font-semibold text-stone-900">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-stone-500">Last updated: April 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-700">
        <section>
          <h2 className="text-lg font-semibold text-stone-900">1. About the Platform</h2>
          <p>
            HomeMade (&quot;we&quot;, &quot;us&quot;, &quot;the platform&quot;) is a
            marketplace that connects home cooks (&quot;cooks&quot;) with customers
            (&quot;buyers&quot;). We are not a food producer, restaurant, or delivery
            service. Each cook operates independently and is solely responsible
            for the food they prepare and sell through the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use this platform. Cooks must
            hold a valid food handler certificate and pass our approval process
            before listing dishes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">3. Cook Responsibilities</h2>
          <p>
            Cooks agree to: accurately declare all allergens present in their
            dishes; maintain food safety and hygiene standards; comply with
            local food preparation and sale regulations; fulfil confirmed
            orders in a timely manner.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">4. Customer Responsibilities</h2>
          <p>
            Customers agree to: review allergen information before placing an
            order; acknowledge that home-cooked food may be prepared in
            environments that contain common allergens; collect orders at the
            agreed time when using pickup.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">5. Orders &amp; Payments</h2>
          <p>
            The platform facilitates orders between cooks and customers. A 16%
            platform commission is applied to each order. Cancellation of
            pending orders is permitted; confirmed orders may only be cancelled
            by the cook. Refund policies will be detailed once payment
            processing is live.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">6. Reviews</h2>
          <p>
            Customers may leave reviews for completed orders. Reviews must be
            honest and respectful. We reserve the right to remove reviews that
            violate community standards.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">7. Account Suspension</h2>
          <p>
            We may suspend or terminate accounts that violate these terms,
            receive repeated complaints, or pose a safety risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">8. Limitation of Liability</h2>
          <p>
            The platform is provided &quot;as is&quot;. We do not guarantee the
            quality, safety, or legality of food sold through the platform.
            To the fullest extent permitted by law, we are not liable for any
            damages arising from your use of the platform or consumption of
            food purchased through it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">9. Changes</h2>
          <p>
            We may update these terms at any time. Continued use of the
            platform constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>
    </main>
  );
}
