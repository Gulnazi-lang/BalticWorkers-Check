import { ENABLED_LOCALES, type Locale } from "@/i18n/config";

/**
 * Добавляет префикс локали к внутреннему пути. Не трогает "/go/..." и
 * "/api/..." — их сюда просто не передают, они вне сегмента [locale].
 */
export function localeHref(locale: Locale, path: string): string {
  if (path === "/") return `/${locale}`;
  if (path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

/** hreflang-альтернативы для конкретного пути (без префикса локали), + x-default на en. */
export function buildAlternates(path: string): Record<string, string> {
  const clean = path === "/" ? "" : path;
  const languages: Record<string, string> = {};
  for (const locale of ENABLED_LOCALES) {
    languages[locale] = `/${locale}${clean}`;
  }
  languages["x-default"] = `/en${clean}`;
  return languages;
}
