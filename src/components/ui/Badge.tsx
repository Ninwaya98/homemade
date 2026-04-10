import type { ReactNode } from "react";

type Tone =
  | "neutral"
  | "amber"
  | "green"
  | "red"
  | "blue"
  | "stone";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-violet-50 text-violet-700 border-violet-200/60",
  amber: "bg-amber-50 text-amber-800 border-amber-200/60",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  red: "bg-red-50 text-red-700 border-red-200/60",
  blue: "bg-sky-50 text-sky-700 border-sky-200/60",
  stone: "bg-slate-900 text-white border-slate-900",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
