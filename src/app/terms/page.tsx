import Link from "next/link";

export const metadata = {
  title: "Terms of Service — HomeMade",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <Link
        href="/"
        className="text-sm text-violet-600 hover:text-violet-700"
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
            marketplace that connects artisan sellers (&quot;sellers&quot;) with
            customers (&quot;buyers&quot;). We are not a manufacturer or shipping
            service. Each seller operates independently and is solely responsible
            for the goods they produce and sell through the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use this platform. Sellers must
            pass our approval process before listing products.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">3. Seller Responsibilities</h2>
          <p>
            Sellers agree to: accurately describe their products and materials;
            comply with local laws governing the sale of handmade goods;
            fulfil confirmed orders in a timely manner; handle customer
            communication respectfully.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">4. Customer Responsibilities</h2>
          <p>
            Customers agree to: review product information before placing an
            order; collect orders at the agreed time when using pickup;
            communicate issues with sellers in good faith.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">5. Orders &amp; Payments</h2>
          <p>
            The platform facilitates orders between sellers and customers. A 16%
            platform commission is applied to each order. Cancellation of
            pending orders is permitted; confirmed orders may only be cancelled
            by the seller. Refund policies will be detailed once payment
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
            quality, safety, or legality of goods sold through the platform.
            To the fullest extent permitted by law, we are not liable for any
            damages arising from your use of the platform or use of goods
            purchased through it.
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
