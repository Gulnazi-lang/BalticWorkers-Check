// Отдельная мини-конфигурация для посадочных страниц работодателей.
// Сознательно НЕ переиспользует @/i18n/config: sv/nb — не локали сайта.
// Сайт на них не переводится, переключателя языков нет, proxy их не трогает
// (см. matcher в src/proxy.ts). Единственное назначение — ссылка в подписи
// письма шведской коммуне или норвежскому подрядчику должна вести на текст
// на его языке, а не на витрину для соискателей на английском.
//
// Норвежский — "nb" (bokmål), не "no": "no" это макроязык, а страница
// написана конкретно на букмоле.
export const EMPLOYER_LANGS = ["sv", "nb"] as const;
export type EmployerLang = (typeof EMPLOYER_LANGS)[number];

export function isEmployerLang(value: string): value is EmployerLang {
  return (EMPLOYER_LANGS as readonly string[]).includes(value);
}

/** Страна, чью биржу труда упоминает страница — для метаданных и заголовка. */
export const EMPLOYER_LANG_COUNTRY: Record<EmployerLang, string> = {
  sv: "SE",
  nb: "NO",
};
