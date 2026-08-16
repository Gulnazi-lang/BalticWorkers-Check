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
  // для этой категории — только для тарифов с legal_force =
  // 'universally_binding' (норвежское allmenngjøring). Для Швеции
  // (members_only) договор определяется КОНКРЕТНЫМ работодателем, не
  // профессией — здесь этому полю не место, см. resolveAgreements.ts.
  // Проставляется автоматически при импорте, но только когда договор и так
  // одинаков для любого работодателя в отрасли.
  agreementCode?: string;
  // В Швеции у этой профессии заведомо несколько параллельных договоров с
  // разными ставками (и у работодателя без договора вообще может быть
  // любая ставка — законного минимума нет). Карточка должна честно
  // предупреждать об этом вместо того, чтобы молчать или гадать какой
  // договор — см. VacancyCard.tsx, tariffAmbiguousSE.
  seAmbiguousAgreement?: boolean;
  // Норвежские ключевые слова для фильтрации фида NAV (см.
  // src/lib/importers/nav.ts) — NAV не даёт поиск по ключу на своей стороне,
  // фильтруем сами по заголовку. Переводы мои собственные, не вычитаны
  // носителем норвежского — как и lt/et, риск невысокий: ошибка здесь
  // максимум пропустит релевантную вакансию, а не исказит показанные данные.
  noKeywords?: string[];
  // Добавлено 16.08.2026 вместе с осью по региону (см. src/lib/contractors.ts,
  // PRIORITY_REGIONS): true у терминов, чья ценность именно в концентрации
  // в Norrbotten/Västerbotten (данные API это подтвердили — та же
  // "anläggningsarbetare" по всей Швеции даёт вакансии где угодно, обычный
  // поиск без региона нашёл бы в основном не тот сегмент, ради которого
  // термин вообще добавлен). У исходных 11 терминов не установлено — они
  // ищут по всей Швеции, как и раньше, это поведение не менялось.
  regionRestricted?: boolean;
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
    // НЕ agreementCode: минимум четыре параллельных договора (PAN 25,
    // HÖK 25/AB 25, Fremia/Vårdföretagarna, AB-P) — какой применим,
    // определяет работодатель, не профессия. 15.08.2026: раньше здесь
    // ошибочно стоял agreementCode: "PAN 25", это приписывало конкретную
    // ставку вакансиям, на которые PAN 25 в большинстве случаев не
    // распространяется — хуже, чем пустое поле.
    seAmbiguousAgreement: true,
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

  // --- 16.08.2026: byggnadsarbetare убран, заменён современными терминами
  // сегмента стройки/спецтехники (см. CLAUDE.md, «Категории импорта»).
  // byggnadsarbetare на живом API дал 1 вакансию в Norrbotten и 1 в
  // Västerbotten по всей Швеции — мёртвый термин, современные шведские
  // объявления используют более узкую лексику. Все ниже помечены
  // regionRestricted: искать их без региона значило бы просто расширить
  // выдачу по всей Швеции тем же сегментом, который проверку не прошёл —
  // ценность этих терминов именно в концентрации на севере.
  {
    term: "anläggningsmaskinförare",
    regionRestricted: true,
    labels: {
      lv: "Speciālās tehnikas operators",
      ru: "Оператор спецтехники",
      en: "Heavy equipment operator",
      lt: "Specialiosios technikos operatorius",
      et: "Erimasinate operaator",
    },
    noKeywords: ["anleggsmaskinfører"],
  },
  {
    term: "anläggningsarbetare",
    regionRestricted: true,
    labels: {
      lv: "Ceļu un zemes darbu strādnieks",
      ru: "Дорожно-строительный рабочий",
      en: "Civil works / groundworks labourer",
      lt: "Kelio ir žemės darbų darbininkas",
      et: "Tee- ja pinnasetööline",
    },
    noKeywords: ["anleggsarbeider"],
  },
  {
    term: "grävmaskinist",
    regionRestricted: true,
    labels: {
      lv: "Ekskavatora vadītājs",
      ru: "Экскаваторщик",
      en: "Excavator operator",
      lt: "Ekskavatoriaus operatorius",
      et: "Ekskavaatorijuht",
    },
    noKeywords: ["gravemaskinfører"],
  },
  {
    term: "mekaniker",
    regionRestricted: true,
    labels: {
      lv: "Mehāniķis",
      ru: "Механик",
      en: "Mechanic",
      lt: "Mechanikas",
      et: "Mehaanik",
    },
    noKeywords: ["mekaniker"],
  },
  {
    term: "terminalarbetare",
    regionRestricted: true,
    labels: {
      lv: "Termināļa darbinieks",
      ru: "Работник терминала",
      en: "Terminal worker",
      lt: "Terminalo darbuotojas",
      et: "Terminalitöötaja",
    },
    noKeywords: ["terminalarbeider"],
  },
  {
    term: "betongarbetare",
    regionRestricted: true,
    labels: {
      lv: "Betonētājs",
      ru: "Бетонщик",
      en: "Concrete worker",
      lt: "Betonuotojas",
      et: "Betoonitööline",
    },
    noKeywords: ["betongarbeider"],
  },
  {
    term: "processoperatör",
    regionRestricted: true,
    labels: {
      lv: "Ražošanas procesa operators",
      ru: "Оператор производственной линии",
      en: "Process operator",
      lt: "Gamybos proceso operatorius",
      et: "Tootmisprotsessi operaator",
    },
    noKeywords: ["prosessoperatør"],
  },
  {
    term: "kranförare",
    regionRestricted: true,
    labels: {
      lv: "Celtņa vadītājs",
      ru: "Крановщик",
      en: "Crane operator",
      lt: "Kranininkas",
      et: "Kraanajuht",
    },
    noKeywords: ["kranfører"],
  },
  {
    term: "eltekniker",
    regionRestricted: true,
    labels: {
      lv: "Elektrotehniķis",
      ru: "Электротехник",
      en: "Electrical technician",
      lt: "Elektrotechnikas",
      et: "Elektrotehnik",
    },
    noKeywords: ["elektrotekniker"],
  },
];

const BY_TERM = new Map(OCCUPATIONS.map((o) => [o.term, o.labels]));
const AGREEMENT_CODE_BY_TERM = new Map(
  OCCUPATIONS.filter((o) => o.agreementCode).map((o) => [o.term, o.agreementCode as string])
);
const SE_AMBIGUOUS_TERMS = new Set(
  OCCUPATIONS.filter((o) => o.seAmbiguousAgreement).map((o) => o.term)
);

/**
 * Код коллективного договора, применимого к этой категории, если есть.
 * term: string | null — вакансии, найденные через ось по работодателю
 * (src/lib/contractors.ts), не всегда сопоставляются ни с одним из
 * терминов поиска (occupationTermFromTitle вернёт null), это не ошибка.
 */
export function agreementCodeForTerm(term: string | null): string | null {
  if (!term) return null;
  return AGREEMENT_CODE_BY_TERM.get(term) ?? null;
}

/** У этой профессии в Швеции заведомо несколько параллельных договоров — см. Occupation.seAmbiguousAgreement. */
export function hasAmbiguousSeAgreement(term: string): boolean {
  return SE_AMBIGUOUS_TERMS.has(term);
}

/**
 * Headline из JobTech — свободный текст на шведском, целиком его не
 * перевести без внешнего MT. Вместо этого переводим фиксированный список
 * категорий поиска (см. OCCUPATIONS выше), которым и так ограничен
 * импортёр — число намеренно не называем здесь, чтобы комментарий не
 * протухал при каждой правке списка (как уже случилось один раз к
 * 16.08.2026 с "12").
 */
export function occupationLabel(term: string | null, locale: Locale): string | null {
  if (!term) return null;
  return BY_TERM.get(term)?.[locale] ?? null;
}

/**
 * Запасной путь для вакансий, импортированных до появления occupation_term
 * (или если оно почему-то не проставилось): сопоставление статическое,
 * значит ждать повторный импорт не нужно — headline почти всегда содержит
 * один из терминов поиска как подстроку. Используется и для перевода
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
