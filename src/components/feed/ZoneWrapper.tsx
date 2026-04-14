import type { ReactNode } from "react";

const cloudColors: Record<string, string> = {
  food: "bg-rose-300/40",
  art: "bg-sky-300/40",
  mixed: "bg-violet-300/30",
};

/**
 * Zone wrapper with a large blurred color cloud behind its content.
 * The cloud is part of the document flow — it scrolls WITH the content,
 * creating a natural, organic color shift as zones enter/leave the viewport.
 * No JavaScript needed. Works on all devices.
 */
export function ZoneWrapper({
  zone,
  children,
}: {
  zone: "food" | "art" | "mixed";
  children: ReactNode;
}) {
  return (
    <div data-zone={zone} className="relative space-y-5">
      {/* Blurred color cloud — extends beyond zone, creates soft glow */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-x-16 -inset-y-24 -z-10 rounded-[60px] ${cloudColors[zone]}`}
        style={{ filter: "blur(80px)" }}
      />
      {children}
    </div>
  );
}
