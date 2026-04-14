"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  tone?: "rose" | "sky" | "violet";
  className?: string;
}

const ringClass: Record<string, string> = {
  rose: "focus-within:ring-rose-300",
  sky: "focus-within:ring-sky-300",
  violet: "focus-within:ring-violet-300",
};

export default function SearchBar({ placeholder = "Search...", defaultValue, tone = "violet", className = "" }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? searchParams.get("q") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updateUrl = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) {
        params.set("q", q.trim());
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setValue(q);
  }, [searchParams]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => updateUrl(v), 300);
  }

  function handleClear() {
    setValue("");
    updateUrl("");
  }

  return (
    <div className={`relative flex items-center rounded-xl bg-white/80 backdrop-blur-sm border border-stone-200 ring-2 ring-transparent transition ${ringClass[tone]} ${className}`}>
      <svg className="absolute left-3 h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx={11} cy={11} r={8} />
        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-transparent py-2.5 pl-10 pr-9 text-sm text-stone-800 placeholder:text-stone-400 outline-none"
      />
      {value && (
        <button onClick={handleClear} className="absolute right-3 text-stone-400 hover:text-stone-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
