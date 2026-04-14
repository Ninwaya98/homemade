import { createClient } from "@/lib/supabase/server";
import { requireSellerProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { RatingBar } from "@/components/ui/RatingBar";
import { SellerReviewResponseForm } from "./response-form";

export const metadata = { title: "Reviews — HomeMade Art" };

export default async function SellerReviewsPage() {
  const { sellerProfile: seller } = await requireSellerProfile();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: reviews } = await sb
    .from("reviews")
    .select("*, profiles!reviews_reviewer_id_fkey(full_name)")
    .eq("reviewee_id", seller.id)
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  const allReviews = reviews ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const needsResponse = allReviews.filter((r: any) => r.sentiment === "dislike" && r.text && r.resolution_status === "none");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingApproval = allReviews.filter((r: any) => r.resolution_status === "pending");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const likes = allReviews.filter((r: any) => r.sentiment === "like");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Reviews</h1>
        <p className="mt-1 text-sm text-stone-500">
          See what customers think and respond to feedback.
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-700">Your score</p>
            <div className="mt-1">
              <RatingBar
                score={(seller as any).score ?? null}
                reviewCount={(seller as any).like_count + (seller as any).dislike_count || (seller as any).rating_count || 0}
                size="md"
              />
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-600">{likes.length}</p>
              <p className="text-[10px] text-stone-500">Likes</p>
            </div>
            <div>
              <p className="text-lg font-bold text-rose-500">{needsResponse.length + pendingApproval.length}</p>
              <p className="text-[10px] text-stone-500">Dislikes</p>
            </div>
          </div>
        </div>
      </Card>

      {needsResponse.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-stone-900">
            Needs your response
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
              {needsResponse.length}
            </span>
          </h2>
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {needsResponse.map((r: any) => (
              <Card key={r.id} className="border-rose-200 bg-rose-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-900">{r.profiles?.full_name ?? "Customer"}</p>
                  <span className="text-sm text-rose-500">{"\uD83D\uDC4E"}</span>
                </div>
                <p className="mt-2 text-sm text-stone-700">{r.text}</p>
                <div className="mt-3 border-t border-rose-200 pt-3">
                  <SellerReviewResponseForm reviewId={r.id} />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {pendingApproval.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-stone-900">Pending approval</h2>
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {pendingApproval.map((r: any) => (
              <Card key={r.id} className="border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-900">{r.profiles?.full_name ?? "Customer"}</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Pending review</span>
                </div>
                <p className="mt-2 text-sm text-stone-700">{r.text}</p>
                <div className="mt-3 rounded-lg border border-amber-200 bg-white/80 p-3">
                  <p className="text-[10px] font-medium uppercase text-amber-600">Your response</p>
                  <p className="mt-1 text-sm text-stone-700">{r.response_text}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {likes.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-stone-900">Positive reviews ({likes.length})</h2>
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {likes.map((r: any) => (
              <Card key={r.id}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-900">{r.profiles?.full_name ?? "Customer"}</p>
                  <span className="text-sm text-emerald-600">{"\uD83D\uDC4D"}</span>
                </div>
                {r.text && <p className="mt-2 text-sm text-stone-700">{r.text}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}

      {allReviews.length === 0 && (
        <Card>
          <p className="text-center text-sm text-stone-500">
            No reviews yet. Once customers complete orders, their feedback will appear here.
          </p>
        </Card>
      )}
    </div>
  );
}
