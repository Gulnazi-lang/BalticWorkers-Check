// LV первым: основной рынок и остальные проекты (majasbalss.lv и т.п.) уже
// используют латышский как первый язык. RU — второй, самый массовый среди
// целевой аудитории (работники из Балтии). EN — международный запасной.
export const LOCALES = ["lv", "ru", "en", "lt", "et"] as const;
export type Locale = (typeof LOCALES)[number];

// Локали, реально отдаваемые пользователю.
// lt/et вычитаны носителями 15.08.2026 и включены — дальнейшая полировка
// возможна по фидбеку уже с живой страницы.
export const ENABLED_LOCALES: readonly Locale[] = ["lv", "ru", "en", "lt", "et"];

export const DEFAULT_LOCALE: Locale = "lv";

export const LOCALE_LABELS: Record<Locale, string> = {
  lv: "Latviešu",
  ru: "Русский",
  en: "English",
  lt: "Lietuvių",
  et: "Eesti",
};

export function isEnabledLocale(value: string): value is Locale {
  return (ENABLED_LOCALES as readonly string[]).includes(value);
}

/** Любой код локали из LOCALES, включая ещё не включённые (lt/et). */
export function isKnownLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
