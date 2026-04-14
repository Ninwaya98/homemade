"use client";

import { useState, useTransition } from "react";
import { addAddress, updateAddress, deleteAddress } from "@/app/actions/addresses";

interface Address {
  id: string;
  label: string;
  address_line: string;
  city: string | null;
  notes: string | null;
  is_default: boolean;
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteAddress(fd);
    });
  }

  return (
    <div className="space-y-4">
      {addresses.map((addr) => (
        <div key={addr.id} className="glass-strong rounded-2xl p-4">
          {editId === addr.id ? (
            <AddressForm
              address={addr}
              onDone={() => setEditId(null)}
              action="update"
            />
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">{addr.label}</span>
                  {addr.is_default && (
                    <span className="rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">Default</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{addr.address_line}</p>
                {addr.city && <p className="text-sm text-stone-500">{addr.city}</p>}
                {addr.notes && <p className="mt-1 text-xs text-stone-400 italic">{addr.notes}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditId(addr.id)} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">Edit</button>
                <button onClick={() => handleDelete(addr.id)} disabled={isPending} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showForm ? (
        <div className="glass-strong rounded-2xl p-4">
          <AddressForm onDone={() => setShowForm(false)} action="add" />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 py-4 text-sm font-medium text-stone-500 dark:text-stone-400 hover:border-violet-300 hover:text-violet-600 transition"
        >
          + Add new address
        </button>
      )}
    </div>
  );
}

function AddressForm({
  address,
  onDone,
  action,
}: {
  address?: Address;
  onDone: () => void;
  action: "add" | "update";
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (address) fd.set("id", address.id);
    startTransition(async () => {
      const result = action === "add" ? await addAddress(fd) : await updateAddress(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-stone-600 dark:text-stone-400">Label</label>
          <input name="label" defaultValue={address?.label ?? "Home"} className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm dark:text-stone-200" />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 dark:text-stone-400">City</label>
          <input name="city" defaultValue={address?.city ?? ""} className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm dark:text-stone-200" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-stone-600 dark:text-stone-400">Address <span className="text-red-400">*</span></label>
        <input name="address_line" defaultValue={address?.address_line ?? ""} required className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm dark:text-stone-200" />
      </div>
      <div>
        <label className="text-xs font-medium text-stone-600 dark:text-stone-400">Notes</label>
        <input name="notes" defaultValue={address?.notes ?? ""} placeholder="Apartment, floor, landmarks..." className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm dark:text-stone-200" />
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
        <input type="checkbox" name="is_default" value="true" defaultChecked={address?.is_default} className="rounded" />
        Set as default
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={isPending} className="gradient-purple rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm">
          {isPending ? "Saving..." : action === "add" ? "Add Address" : "Save Changes"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
          Cancel
        </button>
      </div>
    </form>
  );
}
