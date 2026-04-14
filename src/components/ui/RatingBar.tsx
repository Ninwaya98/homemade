import { scoreColor, scoreBgColor, scoreLabel } from "@/lib/review-utils";

export function RatingBar({
  score,
  reviewCount,
  size = "sm",
}: {
  score: number | null;
  reviewCount: number;
  size?: "sm" | "md";
}) {
  // Not enough reviews yet
  if (score === null || reviewCount < 10) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-stone-200 bg-stone-50 font-medium text-stone-500 ${
          size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        New
      </span>
    );
  }

  const color = scoreColor(score);
  const bgColor = scoreBgColor(score);
  const label = scoreLabel(score);

  if (size === "sm") {
    // Compact: just the score number with colored background
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
        style={{ backgroundColor: bgColor, color }}
      >
        {score}
      </span>
    );
  }

  // Medium: bar + score + label
  return (
    <div className="flex items-center gap-2.5">
      {/* Gradient track */}
      <div className="relative h-2 w-20 overflow-hidden rounded-full bg-stone-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {/* Score + label */}
      <span className="text-sm font-bold" style={{ color }}>
        {score}
      </span>
      <span className="text-xs text-stone-500">
        {label} &middot; {reviewCount} reviews
      </span>
    </div>
  );
}
