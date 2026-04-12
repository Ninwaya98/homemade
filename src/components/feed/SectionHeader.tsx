import Link from "next/link";

export function SectionHeader({
  title,
  seeAllHref,
}: {
  title: string;
  seeAllHref?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-lg font-bold text-stone-900">{title}</h2>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="text-sm font-medium text-violet-600 transition hover:text-violet-800"
        >
          See all &rarr;
        </Link>
      )}
    </div>
  );
}
