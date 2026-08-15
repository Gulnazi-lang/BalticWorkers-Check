import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/href";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const nav = [
    { href: "/#jobs", label: dict.nav.jobs },
    { href: "/how-we-check", label: dict.nav.howWeCheck },
    { href: "/services", label: dict.nav.services },
    { href: "/for-employers", label: dict.nav.forEmployers },
  ];

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex h-18 w-[min(1120px,calc(100%-40px))] items-center gap-8">
        <Link
          href={localeHref(locale, "/")}
          className="flex items-center gap-2.5 text-lg font-extrabold"
        >
          <span className="grid h-8.5 w-8.5 place-items-center rounded-[10px] bg-deep text-[11px] text-white">
            BW
          </span>
          <span>
            BalticWorkers <span className="text-accent">Check</span>
          </span>
        </Link>

        <nav className="ml-auto hidden gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={localeHref(locale, item.href)}
              className="text-sm text-muted hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
