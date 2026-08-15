import type { Locale } from "@/i18n/config";

/** Подстановка {ключ} в строке словаря значениями. */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  );
}

/** BCP47-тег для Intl/toLocaleDateString по локали сайта. */
export const DATE_LOCALE_TAG: Record<Locale, string> = {
  lv: "lv-LV",
  ru: "ru-RU",
  en: "en-GB",
  lt: "lt-LT",
  et: "et-EE",
};
