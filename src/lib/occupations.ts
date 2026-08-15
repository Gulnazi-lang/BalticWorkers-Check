// Профессии, релевантные для целевой аудитории (работники из Балтии).
// Приоритет — массовые, доступные без квалификации категории: именно там
// основной спрос, а не в сварщиках/электриках, которых и так полно в рекламе
// на Facebook. Проверено вручную через API 14.08.2026 (число вакансий на тот
// момент, для ориентира): personlig assistent 2017, hemtjänst 480, städare 820,
// barnvakt 217, barnskötare 204, vårdbiträde 230.
//
// Единый список для импортёра (src/lib/importers/jobtech.ts, поиск по `term`)
// и для карточки вакансии (перевод названия профессии в объявлении по `ru`).
export interface Occupation {
  term: string; // поисковый запрос к JobTech, на шведском
  ru: string; // перевод для отображения в карточке
}

export const OCCUPATIONS: Occupation[] = [
  { term: "personlig assistent", ru: "Личный ассистент / сиделка" },
  { term: "hemtjänst", ru: "Соцработник на дому" },
  { term: "vårdbiträde", ru: "Помощник по уходу" },
  { term: "städare", ru: "Уборщик" },
  { term: "barnvakt", ru: "Няня" },
  { term: "barnskötare", ru: "Няня (детский сад)" },
  { term: "lagerarbetare", ru: "Складской рабочий" },
  { term: "chaufför", ru: "Водитель" },
  { term: "svetsare", ru: "Сварщик" },
  { term: "elektriker", ru: "Электрик" },
  { term: "byggnadsarbetare", ru: "Строительный рабочий" },
  { term: "montör", ru: "Монтажник" },
];

const RU_BY_TERM = new Map(OCCUPATIONS.map((o) => [o.term, o.ru]));

/**
 * Headline из JobTech — свободный текст на шведском, целиком его не
 * перевести без внешнего MT. Вместо этого переводим фиксированный список
 * из 12 категорий поиска, которым и так ограничен импортёр.
 */
export function occupationRu(term: string | null): string | null {
  if (!term) return null;
  return RU_BY_TERM.get(term) ?? null;
}

/**
 * Запасной путь для вакансий, импортированных до появления occupation_term
 * (или если оно почему-то не проставилось): перевод статический, значит
 * ждать повторный импорт не нужно — headline почти всегда содержит один
 * из 12 терминов поиска как подстроку.
 */
export function occupationRuFromTitle(title: string): string | null {
  const lower = title.toLowerCase();
  const match = OCCUPATIONS.find((o) => lower.includes(o.term.toLowerCase()));
  return match?.ru ?? null;
}
