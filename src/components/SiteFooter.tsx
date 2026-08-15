import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/href";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="bg-deep py-6 text-[12px] text-white/70">
      <div className="mx-auto flex w-[min(1120px,calc(100%-40px))] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>{dict.footer.copyright}</span>
        <span>{dict.footer.tagline}</span>
        <Link
          href={localeHref(locale, "/how-we-check")}
          className="text-white/90 underline-offset-4 hover:underline"
        >
          {dict.footer.howWeCheck}
        </Link>
      </div>
    </footer>
  );
}
