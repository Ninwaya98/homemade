"use client";

import type { ReactNode } from "react";

export function HorizontalScroll({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-5 px-5">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {children}
      </div>
    </div>
  );
}
