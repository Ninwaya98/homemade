"use client";

import { useState, type KeyboardEvent } from "react";

/**
 * Multi-tag picker with suggestions. Used for cook cuisine tags.
 * The hidden input named `name` carries comma-separated tags.
 */
export function TagPicker({
  name,
  defaultTags = [],
  suggestions = [],
  placeholder = "Add a tag…",
}: {
  name: string;
  defaultTags?: string[];
  suggestions?: readonly string[];
  placeholder?: string;
}) {
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags([...tags, t]);
    setDraft("");
  };

  const remove = (t: string) => setTags(tags.filter((x) => x !== t));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const remainingSuggestions = suggestions.filter((s) => !tags.includes(s));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-900"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              aria-label={`Remove ${t}`}
              className="text-violet-600 hover:text-violet-800"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => draft && add(draft)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[8ch] bg-transparent outline-none text-sm text-stone-900"
        />
      </div>

      {remainingSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remainingSuggestions.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => add(s)}
              className="rounded-full border border-stone-300 px-2.5 py-0.5 text-xs text-stone-600 hover:border-violet-500 hover:text-violet-600"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <input type="hidden" name={name} value={tags.join(",")} />
    </div>
  );
}
