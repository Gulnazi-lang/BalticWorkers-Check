"use client";

import { useActionState } from "react";
import { subscribeToAlerts, type SubscribeState } from "@/app/actions/alerts";

const initialState: SubscribeState = { status: "idle", message: "" };

export function AlertSubscribeForm({ query, country }: { query: string; country: string }) {
  const [state, formAction, pending] = useActionState(subscribeToAlerts, initialState);

  return (
    <div className="mt-6 rounded-2xl border border-line bg-card p-5">
      <h3 className="text-sm font-semibold">Получать такие вакансии на почту</h3>
      <p className="mt-1 text-[13px] text-muted">
        Бесплатно. Пришлём письмо для подтверждения, отписаться можно в один клик.
      </p>
      <form action={formAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="q" value={query} />
        <input type="hidden" name="country" value={country} />
        <input
          type="email"
          name="email"
          required
          placeholder="ваш email"
          className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Отправляем…" : "Подписаться"}
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
