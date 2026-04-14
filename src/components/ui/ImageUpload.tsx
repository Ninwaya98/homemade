"use client";

import { useState, useRef } from "react";
import { processImage } from "@/lib/image-utils";

/**
 * Image upload input that auto-crops to square and compresses to ≤1MB.
 * Accepts any image format the browser supports. Shows a live preview.
 *
 * The processed File is stored in a hidden DataTransfer so the parent
 * <form> picks it up with the correct `name`.
 */
export function ImageUpload({
  name,
  existingUrl,
  multiple = false,
}: {
  name: string;
  existingUrl?: string | null;
  multiple?: boolean;
}) {
  const [previews, setPreviews] = useState<string[]>(
    existingUrl ? [existingUrl] : [],
  );
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setProcessing(true);

    try {
      const processed: File[] = [];
      const urls: string[] = [];

      for (const file of files) {
        const result = await processImage(file);
        processed.push(result);
        urls.push(URL.createObjectURL(result));
      }

      // Replace the input's files with processed versions
      const dt = new DataTransfer();
      for (const f of processed) {
        dt.items.add(f);
      }
      if (inputRef.current) {
        inputRef.current.files = dt.files;
      }

      setPreviews(urls);
    } catch {
      // If processing fails, keep the original files
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className="h-20 w-20 rounded-xl object-cover border border-stone-200 shadow-sm"
            />
          ))}
        </div>
      )}

      {/* File input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept="image/*"
          multiple={multiple}
          onChange={handleChange}
          className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-stone-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-stone-900 hover:file:bg-stone-300"
        />
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80">
            <p className="text-xs font-medium text-violet-600 animate-pulse">
              Processing image...
            </p>
          </div>
        )}
      </div>

      <p className="text-[11px] text-stone-400">
        Any image format accepted. Auto-cropped to square, compressed to &lt;1 MB.
      </p>
    </div>
  );
}
