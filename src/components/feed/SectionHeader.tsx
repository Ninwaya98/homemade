import Link from "next/link";

const toneClasses = {
  violet: "text-violet-600 hover:text-violet-800",
  rose: "text-rose-600 hover:text-rose-800",
  sky: "text-sky-600 hover:text-sky-800",
};

const titleToneClasses = {
  violet: "text-stone-900",
  rose: "text-rose-800",
  sky: "text-sky-800",
};

export function SectionHeader({
  title,
  seeAllHref,
  tone = "violet",
}: {
  title: string;
  seeAllHref?: string;
  tone?: "violet" | "rose" | "sky";
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className={`text-lg font-bold ${titleToneClasses[tone]}`}>{title}</h2>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className={`text-sm font-medium transition ${toneClasses[tone]}`}
        >
          See all &rarr;
        </Link>
      )}
    </div>
  );
}
