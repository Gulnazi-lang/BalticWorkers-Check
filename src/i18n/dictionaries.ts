import type { Locale } from "@/i18n/config";
import type lv from "@/i18n/messages/lv.json";

export type Dictionary = typeof lv;

// Динамический import по локали — в бандл конкретной страницы попадает
// только один словарь, а не все пять сразу. Все пять файлов гарантированно
// одинаковой формы (см. i18n-spec: приёмка требует совпадения ключей).
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  lv: () => import("@/i18n/messages/lv.json").then((m) => m.default as Dictionary),
  ru: () => import("@/i18n/messages/ru.json").then((m) => m.default as Dictionary),
  en: () => import("@/i18n/messages/en.json").then((m) => m.default as Dictionary),
  lt: () => import("@/i18n/messages/lt.json").then((m) => m.default as Dictionary),
  et: () => import("@/i18n/messages/et.json").then((m) => m.default as Dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}
