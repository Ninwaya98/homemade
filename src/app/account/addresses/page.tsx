import { requireAuth } from "@/lib/auth";
import { getAddresses } from "@/app/actions/addresses";
import { AddressManager } from "./address-manager";

export const metadata = { title: "Delivery Addresses — HomeMade" };

export default async function AddressesPage() {
  await requireAuth();
  const addresses = await getAddresses();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Delivery Addresses</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Save addresses for faster checkout</p>
      <div className="mt-6">
        <AddressManager addresses={addresses as any} />
      </div>
    </div>
  );
}
