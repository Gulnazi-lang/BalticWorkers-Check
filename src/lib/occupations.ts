import type { Locale } from "@/i18n/config";

// Профессии, релевантные для целевой аудитории (работники из Балтии).
// Приоритет — массовые, доступные без квалификации категории: именно там
// основной спрос, а не в сварщиках/электриках, которых и так полно в рекламе
// на Facebook. Проверено вручную через API 14.08.2026 (число вакансий на тот
// момент, для ориентира): personlig assistent 2017, hemtjänst 480, städare 820,
// barnvakt 217, barnskötare 204, vårdbiträde 230.
//
// Единый список для импортёра (src/lib/importers/jobtech.ts, поиск по `term`)
// и для карточки вакансии (перевод названия профессии в объявлении по `labels`).
// lt/et переведены для структурной полноты, но не показываются, пока сами
// эти локали за ENABLED_LOCALES (см. src/i18n/config.ts) — не вычитаны носителем.
export interface Occupation {
  term: string; // поисковый запрос к JobTech, на шведском
  labels: Record<Locale, string>;
  // Код применимого коллективного договора (public.collective_agreements.code)
  // для этой категории — детерминированная привязка, ставится при импорте
  // автоматически. Не путать с employer_agreement_status: связан ли КОНКРЕТНЫЙ
  // работодатель договором — решает редакция вручную, это не отсюда.
  agreementCode?: string;
  // Норвежские ключевые слова для фильтрации фида NAV (см.
  // src/lib/importers/nav.ts) — NAV не даёт поиск по ключу на своей стороне,
  // фильтруем сами по заголовку. Переводы мои собственные, не вычитаны
  // носителем норвежского — как и lt/et, риск невысокий: ошибка здесь
  // максимум пропустит релевантную вакансию, а не исказит показанные данные.
  noKeywords?: string[];
}

export const OCCUPATIONS: Occupation[] = [
  {
    term: "personlig assistent",
    labels: {
      lv: "Personīgais asistents / aprūpētājs",
      ru: "Личный ассистент / сиделка",
      en: "Personal assistant / carer",
      lt: "Asmeninis asistentas / slaugas",
      et: "Isiklik abistaja / hooldaja",
    },
    agreementCode: "PAN 25",
    noKeywords: ["personlig assistent"],
  },
  {
    term: "hemtjänst",
    labels: {
      lv: "Mājas aprūpes darbinieks",
      ru: "Соцработник на дому",
      en: "Home care worker",
      lt: "Namų priežiūros darbuotojas",
      et: "Koduhooldustöötaja",
    },
    noKeywords: ["hjemmetjeneste", "hjemmehjelp"],
  },
  {
    term: "vårdbiträde",
    labels: {
      lv: "Aprūpes palīgs",
      ru: "Помощник по уходу",
      en: "Care assistant",
      lt: "Slaugos padėjėjas",
      et: "Hooldusabiline",
    },
    noKeywords: ["helsefagarbeider", "pleiemedarbeider", "omsorgsarbeider"],
  },
  {
    term: "städare",
    labels: {
      lv: "Apkopējs",
      ru: "Уборщик",
      en: "Cleaner",
      lt: "Valytojas",
      et: "Koristaja",
    },
    noKeywords: ["renholder", "renhold"],
  },
  {
    term: "barnvakt",
    labels: {
      lv: "Auklīte",
      ru: "Няня",
      en: "Babysitter",
      lt: "Auklė",
      et: "Lapsehoidja",
    },
    noKeywords: ["barnevakt"],
  },
  {
    term: "barnskötare",
    labels: {
      lv: "Bērnu aprūpētājs (bērnudārzā)",
      ru: "Няня (детский сад)",
      en: "Childcare worker (kindergarten)",
      lt: "Auklė (darželyje)",
      et: "Lapsehoidja (lasteaias)",
    },
    noKeywords: ["barnehageassistent", "barnehagemedarbeider"],
  },
  {
    term: "lagerarbetare",
    labels: {
      lv: "Noliktavas darbinieks",
      ru: "Складской рабочий",
      en: "Warehouse worker",
      lt: "Sandėlio darbuotojas",
      et: "Laotöötaja",
    },
    noKeywords: ["lagermedarbeider", "lagerarbeider"],
  },
  {
    term: "chaufför",
    labels: {
      lv: "Šoferis",
      ru: "Водитель",
      en: "Driver",
      lt: "Vairuotojas",
      et: "Autojuht",
    },
    noKeywords: ["sjåfør"],
  },
  {
    term: "svetsare",
    labels: {
      lv: "Metinātājs",
      ru: "Сварщик",
      en: "Welder",
      lt: "Suvirintojas",
      et: "Keevitaja",
    },
    noKeywords: ["sveiser"],
  },
  {
    term: "elektriker",
    labels: {
      lv: "Elektriķis",
      ru: "Электрик",
      en: "Electrician",
      lt: "Elektrikas",
      et: "Elektrik",
    },
    noKeywords: ["elektriker"],
  },
  {
    term: "byggnadsarbetare",
    labels: {
      lv: "Būvstrādnieks",
      ru: "Строительный рабочий",
      en: "Construction worker",
      lt: "Statybininkas",
      et: "Ehitustööline",
    },
    noKeywords: ["bygningsarbeider", "byggearbeider"],
  },
  {
    term: "montör",
    labels: {
      lv: "Montieris",
      ru: "Монтажник",
      en: "Fitter / assembler",
      lt: "Montuotojas",
      et: "Montöör",
    },
    noKeywords: ["montør"],
  },
];

const BY_TERM = new Map(OCCUPATIONS.map((o) => [o.term, o.labels]));
const AGREEMENT_CODE_BY_TERM = new Map(
  OCCUPATIONS.filter((o) => o.agreementCode).map((o) => [o.term, o.agreementCode as string])
);

/** Код коллективного договора, применимого к этой категории, если есть. */
export function agreementCodeForTerm(term: string): string | null {
  return AGREEMENT_CODE_BY_TERM.get(term) ?? null;
}

/**
 * Headline из JobTech — свободный текст на шведском, целиком его не
 * перевести без внешнего MT. Вместо этого переводим фиксированный список
 * из 12 категорий поиска, которым и так ограничен импортёр.
 */
export function occupationLabel(term: string | null, locale: Locale): string | null {
  if (!term) return null;
  return BY_TERM.get(term)?.[locale] ?? null;
}

/**
 * Запасной путь для вакансий, импортированных до появления occupation_term
 * (или если оно почему-то не проставилось): сопоставление статическое,
 * значит ждать повторный импорт не нужно — headline почти всегда содержит
 * один из 12 терминов поиска как подстроку. Используется и для перевода
 * названия профессии, и (через agreementCodeForTerm) для привязки тарифа —
 * оба статические, оба не должны ждать cron.
 */
export function occupationTermFromTitle(title: string): string | null {
  const lower = title.toLowerCase();
  return OCCUPATIONS.find((o) => lower.includes(o.term.toLowerCase()))?.term ?? null;
}

export function occupationLabelFromTitle(title: string, locale: Locale): string | null {
  const term = occupationTermFromTitle(title);
  return term ? (BY_TERM.get(term)?.[locale] ?? null) : null;
}
