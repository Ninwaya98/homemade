/**
 * Review system utilities — score calculation, color mapping, profile recalculation.
 *
 * Score = (likes / (likes + validDislikes)) * 100
 * A "valid dislike" = dislike with text, not yet resolved.
 * Resolved dislikes are removed from the calculation (neutral).
 * Score is null until at least 10 counted reviews (likes + valid dislikes).
 */

const MIN_REVIEWS_FOR_SCORE = 10;

/** Calculate score 1-100 from like/dislike counts. Returns null if < 10 reviews. */
export function calculateScore(
  likes: number,
  validDislikes: number,
): number | null {
  const total = likes + validDislikes;
  if (total < MIN_REVIEWS_FOR_SCORE) return null;
  if (total === 0) return null;
  return Math.round((likes / total) * 100);
}

/**
 * Map score (0-100) to an HSL hue value.
 * 0 → hue 0 (red), 50 → hue 60 (yellow), 100 → hue 120 (green).
 */
export function scoreHue(score: number): number {
  return Math.round(score * 1.2);
}

/** Returns an inline HSL color string for a given score. */
export function scoreColor(score: number): string {
  return `hsl(${scoreHue(score)}, 70%, 45%)`;
}

/** Returns a background-tint HSL color string (lighter) for a given score. */
export function scoreBgColor(score: number): string {
  return `hsl(${scoreHue(score)}, 70%, 92%)`;
}

/** Human-readable label for a score. */
export function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Great";
  if (score >= 60) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Needs work";
  return "Poor";
}

/**
 * Recalculate and update a cook or seller profile's review aggregates.
 * Call this after every review submission, update, or resolution.
 */
export async function recalculateProfileScore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  profileId: string,
  vertical: "kitchen" | "market",
) {
  // Fetch all customer reviews for this profile
  const { data: reviews } = await supabase
    .from("reviews")
    .select("sentiment, text, resolution_status")
    .eq("reviewee_id", profileId)
    .eq("role", "customer");

  if (!reviews) return;

  let likes = 0;
  let validDislikes = 0;
  let resolved = 0;

  for (const r of reviews) {
    if (r.sentiment === "like") {
      likes++;
    } else if (r.sentiment === "dislike") {
      if (r.resolution_status === "approved") {
        resolved++;
      } else if (r.text) {
        // Dislike with text that isn't resolved = valid dislike
        validDislikes++;
      }
      // Dislike without text = forgiven, not counted
    }
  }

  const total = likes + validDislikes;
  const score = total >= MIN_REVIEWS_FOR_SCORE
    ? Math.round((likes / total) * 100)
    : null;

  const table = vertical === "market" ? "seller_profiles" : "cook_profiles";

  await supabase
    .from(table)
    .update({
      like_count: likes,
      dislike_count: validDislikes,
      resolved_count: resolved,
      score,
      // Keep legacy fields in sync
      avg_rating: total > 0 ? Number(((likes / total) * 5).toFixed(2)) : 0,
      rating_count: likes + validDislikes + resolved,
    })
    .eq("id", profileId);
}
