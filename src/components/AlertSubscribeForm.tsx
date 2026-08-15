"use client";

import { useActionState } from "react";
import { subscribeToAlerts, type SubscribeState } from "@/app/actions/alerts";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const initialState: SubscribeState = { status: "idle", message: "" };

export function AlertSubscribeForm({
  query,
  country,
  locale,
  dict,
}: {
  query: string;
  country: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(subscribeToAlerts, initialState);

  return (
    <div className="mt-6 rounded-2xl border border-line bg-card p-5">
      <h3 className="text-sm font-semibold">{dict.alerts.title}</h3>
      <p className="mt-1 text-[13px] text-muted">{dict.alerts.note}</p>
      <form action={formAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="q" value={query} />
        <input type="hidden" name="country" value={country} />
        <input type="hidden" name="locale" value={locale} />
        <input
          type="email"
          name="email"
          required
          placeholder={dict.alerts.emailPlaceholder}
          className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? dict.alerts.submitting : dict.alerts.submit}
        </button>
      </form>
      {state.message && (
        <p
          className={`mt-2 text-[13px] ${
            state.status === "error" ? "text-tone-amber-ink" : "text-accent"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
