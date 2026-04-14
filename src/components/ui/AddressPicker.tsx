"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Address {
  id: string;
  label: string;
  address_line: string;
  city: string | null;
  notes: string | null;
  is_default: boolean;
}

interface AddressPickerProps {
  name?: string;
  defaultValue?: string;
}

export default function AddressPicker({ name = "delivery_address", defaultValue }: AddressPickerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<string>(defaultValue ?? "");
  const [custom, setCustom] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("delivery_addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false });
        if (data && data.length > 0) {
          setAddresses(data);
          if (!defaultValue) {
            const def = data.find((a: Address) => a.is_default);
            if (def) setSelected(def.address_line + (def.notes ? ` (${def.notes})` : ""));
          }
        } else {
          setCustom(true);
        }
      } catch {
        setCustom(true);
      }
    }
    load();
  }, [defaultValue]);

  if (custom || addresses.length === 0) {
    return (
      <div>
        <textarea
          name={name}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          placeholder="Enter delivery address..."
          rows={2}
          className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm dark:text-stone-200 placeholder:text-stone-400"
        />
        {addresses.length > 0 && (
          <button type="button" onClick={() => setCustom(false)} className="mt-1 text-xs text-violet-600 dark:text-violet-400 hover:underline">
            Choose saved address
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select
        onChange={(e) => {
          if (e.target.value === "__custom") {
            setCustom(true);
            setSelected("");
          } else {
            const addr = addresses.find((a) => a.id === e.target.value);
            if (addr) setSelected(addr.address_line + (addr.notes ? ` (${addr.notes})` : ""));
          }
        }}
        className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm dark:text-stone-200"
      >
        {addresses.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label} — {a.address_line}{a.city ? `, ${a.city}` : ""}
          </option>
        ))}
        <option value="__custom">Enter new address...</option>
      </select>
      <input type="hidden" name={name} value={selected} />
    </div>
  );
}
