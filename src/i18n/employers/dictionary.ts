import type { EmployerLang } from "@/i18n/employers/config";
import type sv from "@/i18n/employers/sv.json";

export type EmployerDictionary = typeof sv;

// Своя пара словарей, не связанная с src/i18n/messages/*.json: там ключи
// про поиск вакансий и подписку, здесь — про уточнение условий. Пересечение
// было бы почти нулевым, а общий тип заставлял бы держать sv/nb в пяти
// остальных файлах.
const loaders: Record<EmployerLang, () => Promise<EmployerDictionary>> = {
  sv: () => import("@/i18n/employers/sv.json").then((m) => m.default as EmployerDictionary),
  nb: () => import("@/i18n/employers/nb.json").then((m) => m.default as EmployerDictionary),
};

export async function getEmployerDictionary(lang: EmployerLang): Promise<EmployerDictionary> {
  return loaders[lang]();
}
