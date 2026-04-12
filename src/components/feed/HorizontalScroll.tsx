"use client";

import type { ReactNode } from "react";

export function HorizontalScroll({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-5 px-5">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {children}
      </div>
      {/* Right fade hint — shows there's more to scroll */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#f8f7ff] to-transparent" />
    </div>
  );
}
