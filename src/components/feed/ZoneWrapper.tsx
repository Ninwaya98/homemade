import type { ReactNode } from "react";

/**
 * Zone wrapper with a large blurred sky-blue cloud behind its content.
 * The cloud is part of the document flow — it scrolls WITH the content,
 * creating a natural, organic color shift as zones enter/leave the viewport.
 * No JavaScript needed. Works on all devices.
 */
export function ZoneWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative space-y-5">
      {/* Blurred color cloud — extends beyond zone, creates soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-16 -inset-y-24 -z-10 rounded-[60px] bg-sky-300/40"
        style={{ filter: "blur(80px)" }}
      />
      {children}
    </div>
  );
}
