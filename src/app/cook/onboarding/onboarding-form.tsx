"use client";

import { useActionState } from "react";

import { submitOnboarding, type OnboardingState } from "@/app/cook/actions";
import { Button } from "@/components/ui/Button";
import { Field, TextareaField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { TagPicker } from "@/components/ui/TagPicker";
import { CUISINES } from "@/lib/constants";

const initial: OnboardingState = undefined;

export function OnboardingForm({
  defaultBio,
  defaultCuisineTags,
  defaultPhone,
  defaultLocation,
  hasCertificate,
  currentPhotoUrl,
}: {
  defaultBio: string;
  defaultCuisineTags: string[];
  defaultPhone: string;
  defaultLocation: string;
  hasCertificate: boolean;
  currentPhotoUrl: string | null;
}) {
  const [state, action, pending] = useActionState(submitOnboarding, initial);

  return (
    <form action={action} className="space-y-6">
      <Card>
        <h2 className="text-base font-semibold text-stone-900">About you</h2>
        <p className="mt-1 text-sm text-stone-600">
          Customers see this on your kitchen page. Tell them what you cook
          and why.
        </p>
        <div className="mt-5 space-y-5">
          <TextareaField
            label="Your story"
            name="bio"
            defaultValue={defaultBio}
            rows={5}
            placeholder="I grew up cooking with my grandmother in Baghdad…"
            required
            hint="At least 20 characters. Customers love a real story."
          />
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Cuisine tags <span className="ml-1 text-violet-600">*</span>
            </label>
            <p className="mt-1 text-xs text-stone-500">
              Pick the cuisines you cook. Tap a suggestion or type your own.
            </p>
            <div className="mt-2">
              <TagPicker
                name="cuisine_tags"
                defaultTags={defaultCuisineTags}
                suggestions={CUISINES}
                placeholder="e.g. Iraqi, Levantine"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">How customers reach you</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={defaultPhone}
            placeholder="+964 …"
            required
          />
          <Field
            label="Location"
            name="location"
            type="text"
            defaultValue={defaultLocation}
            placeholder="Karrada, Baghdad"
            required
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">
          Food handler certificate
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          A photo or PDF of your food handler certificate. Only our admin
          team can see this — customers never see it.
        </p>
        <div className="mt-5">
          <input
            type="file"
            name="certificate"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required={!hasCertificate}
            className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-violet-700"
          />
          {hasCertificate && (
            <p className="mt-2 text-xs text-stone-500">
              You&apos;ve already uploaded one. Pick a new file only if you
              want to replace it.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">Photo of you (optional)</h2>
        <p className="mt-1 text-sm text-stone-600">
          A friendly photo helps customers feel they know who&apos;s
          cooking. Skip if you&apos;d rather not.
        </p>
        <div className="mt-5 flex items-center gap-4">
          {currentPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentPhotoUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-stone-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-stone-900 hover:file:bg-stone-300"
          />
        </div>
      </Card>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-xs text-violet-900">
        <strong>What happens next:</strong> we&apos;ll review your
        certificate and approve your kitchen within 1–2 days. You&apos;ll
        get an email when it&apos;s live. Until then your dishes are
        hidden from customers.
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Submitting…" : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
