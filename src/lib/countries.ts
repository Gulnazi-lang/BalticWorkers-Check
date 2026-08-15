import type { Dictionary } from "@/i18n/dictionaries";

// Справочник стран зеркалит public.countries в БД. Добавление новой
// страны — правка списка тут + перевод в словарях (common.country.*),
// без изменения типов Vacancy/VacancyRow — country там просто string.
export const KNOWN_COUNTRY_CODES = ["SE", "NO"] as const;
export type KnownCountryCode = (typeof KNOWN_COUNTRY_CODES)[number];

export function isKnownCountryCode(value: string): value is KnownCountryCode {
  return (KNOWN_COUNTRY_CODES as readonly string[]).includes(value);
}

/** Название страны из словаря; неизвестный код показываем как есть, а не скрываем. */
export function countryLabel(dict: Dictionary, code: string): string {
  return isKnownCountryCode(code) ? dict.common.country[code] : code;
}
