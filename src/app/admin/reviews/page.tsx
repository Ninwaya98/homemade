import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { AdminReviewActions } from "./review-actions";

export const metadata = { title: "Review Moderation — HomeMade Admin" };

export default async function AdminReviewsPage() {
  await requireRole("admin");
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Pending resolution responses
  const { data: pending } = await sb
    .from("reviews")
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(full_name),
      reviewee:profiles!reviews_reviewee_id_fkey(full_name)
    `)
    .eq("resolution_status", "pending")
    .order("response_at", { ascending: true });

  // Recent resolved
  const { data: resolved } = await sb
    .from("reviews")
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(full_name),
      reviewee:profiles!reviews_reviewee_id_fkey(full_name)
    `)
    .in("resolution_status", ["approved", "rejected"])
    .order("resolved_at", { ascending: false })
    .limit(20);

  // All recent reviews (last 50)
  const { data: allRecent } = await sb
    .from("reviews")
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(full_name),
      reviewee:profiles!reviews_reviewee_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const pendingList = pending ?? [];
  const resolvedList = resolved ?? [];
  const allList = allRecent ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Review Moderation</h1>
        <p className="mt-1 text-sm text-stone-500">
          Approve or reject cook/seller responses to bad reviews.
        </p>
      </div>

      {/* Pending resolutions */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-900">
          Pending Responses
          {pendingList.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              {pendingList.length}
            </span>
          )}
        </h2>
        {pendingList.length === 0 ? (
          <Card><p className="text-sm text-stone-500">No pending responses to review.</p></Card>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {pendingList.map((r: any) => (
              <Card key={r.id} className="border-amber-200">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Customer review */}
                  <div>
                    <p className="text-[10px] font-medium uppercase text-rose-500">Customer complaint</p>
                    <p className="mt-1 text-sm font-medium text-stone-900">
                      {r.reviewer?.full_name ?? "Customer"}
                    </p>
                    <p className="mt-1 text-sm text-stone-700">{r.text}</p>
                    <p className="mt-1 text-[10px] text-stone-400">
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  {/* Cook/seller response */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                    <p className="text-[10px] font-medium uppercase text-amber-600">Response from</p>
                    <p className="mt-0.5 text-sm font-medium text-stone-900">
                      {r.reviewee?.full_name ?? "Cook/Seller"}
                    </p>
                    <p className="mt-1 text-sm text-stone-700">{r.response_text}</p>
                    <p className="mt-1 text-[10px] text-stone-400">
                      {r.response_at && new Date(r.response_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-stone-200 pt-3">
                  <AdminReviewActions reviewId={r.id} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recently resolved */}
      {resolvedList.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">Recently Resolved</h2>
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {resolvedList.map((r: any) => (
              <Card key={r.id} className={r.resolution_status === "approved" ? "border-emerald-200 bg-emerald-50/30" : "border-stone-200"}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      r.resolution_status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {r.resolution_status === "approved" ? "Approved" : "Rejected"}
                    </span>
                    <p className="text-sm text-stone-700">
                      <span className="font-medium">{r.reviewer?.full_name}</span> → {r.reviewee?.full_name}
                    </p>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    {r.resolved_at && new Date(r.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* All recent reviews */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">All Recent Reviews</h2>
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">From</th>
                <th className="px-4 py-2">To</th>
                <th className="px-4 py-2">Text</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {allList.map((r: any) => (
                <tr key={r.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-2">
                    <span className={r.sentiment === "like" ? "text-emerald-600" : "text-rose-500"}>
                      {r.sentiment === "like" ? "\uD83D\uDC4D" : "\uD83D\uDC4E"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-stone-900">{r.reviewer?.full_name ?? "—"}</td>
                  <td className="px-4 py-2 text-stone-900">{r.reviewee?.full_name ?? "—"}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-stone-600">{r.text ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      r.resolution_status === "none" ? "bg-stone-100 text-stone-500" :
                      r.resolution_status === "pending" ? "bg-amber-100 text-amber-700" :
                      r.resolution_status === "approved" ? "bg-emerald-100 text-emerald-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {r.resolution_status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-stone-400">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
