"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ENABLED_LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 год

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  useEffect(() => {
    if (!pendingLocale || pendingLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${pendingLocale}; path=/; max-age=${COOKIE_MAX_AGE}`;
    const rest = pathname.split("/").slice(2).join("/");
    router.push(`/${pendingLocale}${rest ? `/${rest}` : ""}`);
  }, [locale, pathname, pendingLocale, router]);

  function switchTo(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    setPendingLocale(next);
  }

  return (
    <div ref={ref} className="relative ml-auto md:ml-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium whitespace-nowrap"
      >
        {LOCALE_LABELS[locale]}
        <span className="text-muted" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 min-w-32 overflow-hidden rounded-lg border border-line bg-card py-1 shadow-lg">
          {ENABLED_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchTo(l)}
              className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-bg ${
                l === locale ? "font-bold text-accent" : "text-ink"
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
