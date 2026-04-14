"use client";

import { useTheme } from "@/lib/theme";

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="h-9 w-9 flex items-center justify-center rounded-full bg-white/60 dark:bg-stone-800/60 backdrop-blur border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
    >
      {theme === "dark" ? (
        <svg className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx={12} cy={12} r={5} />
          <path strokeLinecap="round" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.36-7.36l-1.42 1.42M7.05 16.95l-1.42 1.42m12.73 0l-1.42-1.42M7.05 7.05L5.63 5.63" />
        </svg>
      ) : (
        <svg className="h-4 w-4 text-violet-500 transition-transform duration-300 rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}
