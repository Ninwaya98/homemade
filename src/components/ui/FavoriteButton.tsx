"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/favorites";

interface FavoriteButtonProps {
  dishId?: string;
  productId?: string;
  initialFavorited?: boolean;
  className?: string;
}

export default function FavoriteButton({ dishId, productId, initialFavorited = false, className = "" }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFavorited(!favorited);
    startTransition(async () => {
      const fd = new FormData();
      if (dishId) fd.set("dishId", dishId);
      if (productId) fd.set("productId", productId);
      const result = await toggleFavorite(fd);
      if (result?.error) setFavorited(favorited);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      className={`h-8 w-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-stone-800/80 backdrop-blur shadow-sm border border-stone-100 dark:border-stone-700 hover:scale-110 active:scale-95 transition-all duration-200 ${className}`}
    >
      <svg
        className={`h-4 w-4 transition-colors duration-200 ${favorited ? "text-red-500 fill-red-500" : "text-stone-400 dark:text-stone-500"}`}
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  );
}
