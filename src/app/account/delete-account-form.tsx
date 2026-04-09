"use client";

import { useActionState } from "react";

import { deleteAccount, type DeleteAccountState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(
    deleteAccount,
    undefined,
  );

  return (
    <form action={action} className="mt-4 max-w-sm">
      {state?.error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Field
        label='Type "DELETE" to confirm'
        name="confirmation"
        placeholder="DELETE"
        required
      />

      <div className="mt-4">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "Deleting…" : "Permanently delete my account"}
        </Button>
      </div>
    </form>
  );
}
