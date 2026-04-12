"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { BasketItem } from "@/lib/types";

const STORAGE_KEY = "homemade-basket";

type BasketContextValue = {
  items: BasketItem[];
  itemCount: number;
  totalCents: number;
  /** The cookId currently in the basket, or null if empty */
  currentCookId: string | null;
  /** The cook name currently in the basket, or null if empty */
  currentCookName: string | null;
  addItem: (item: Omit<BasketItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearBasket: () => void;
};

const BasketContext = createContext<BasketContextValue>({
  items: [],
  itemCount: 0,
  totalCents: 0,
  currentCookId: null,
  currentCookName: null,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearBasket: () => {},
});

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore parse errors */
    }
    setHydrated(true);
  }, []);

  // Persist on change (only after initial hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setItems(parsed);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Add an item. Callers should check currentCookId before calling
  // to enforce single-cook restriction (the order form does this).
  const addItem = useCallback((item: Omit<BasketItem, "id">) => {
    setItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, Math.min(20, quantity)) } : i,
      ),
    );
  }, []);

  const clearBasket = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const currentCookId = items.length > 0 ? items[0].cookId : null;
  const currentCookName = items.length > 0 ? items[0].cookName : null;

  return (
    <BasketContext.Provider
      value={{
        items, itemCount, totalCents,
        currentCookId, currentCookName,
        addItem, removeItem, updateQuantity, clearBasket,
      }}
    >
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  return useContext(BasketContext);
}
