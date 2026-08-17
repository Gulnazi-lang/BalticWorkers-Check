import type { Locale } from "@/i18n/config";

// Профессии, релевантные для целевой аудитории (работники из Балтии, едущие
// на работу в Швецию/Норвегию, часто в конкретный регион под конкретный
// проект). Критерий — не "массовость" сама по себе (это было исходным
// критерием 14.08.2026, потом уточнено), а структурная совместимость с
// продуктом: ценность платформы держится на пяти полях (зарплата, жильё,
// дорога, часы, коллективный договор), и эти поля появляются в объявлении
// только когда работодатель РЕШАЕТ вопрос переезда — бригаду везут в другой
// город/страну, значит есть что написать про жильё и дорогу. У локальной
// работы (человек живёт дома, ездит на своей машине) этих полей структурно
// не бывает — не потому что работодатель поленился написать, а потому что
// вопрос просто не встаёт.
//
// 16.08.2026: care/домашние категории (personlig assistent, hemtjänst,
// vårdbiträde, städare, barnvakt, barnskötare) убраны по этому критерию —
// не «менее приоритетные», а структурно несовместимые с продуктом. Проверено
// на реальных данных, не на предположении: на 63 объявлениях этого сегмента
// (14.08-16.08.2026) — 0 честных сигналов жилья или дороги для работника
// (единственные найденные упоминания "boende" оказались либо домом
// престарелых, либо бизнес-описанием компании, не жильём работника). Все 69
// уже импортированных вакансий этих категорий на момент решения — 0 из 5
// заполненных полей, и это не следствие раннего импорта, а свойство
// категории: ручное обогащение (docs/manual-enrichment.md) тоже не найдёт
// там того, чего в объявлении никогда не было. Дополнительно (не главный
// аргумент, но подтверждающий): 55 из 150 объявлений этого сегмента (36.7%)
// прямо в тексте требуют шведский язык — заметно выше, чем в сегменте
// стройки (10.2% по структурному полю на 225 объявлениях, хотя оба числа
// сравнивать напрямую нельзя — считались разными методами).
//
// Если однажды понадобится вернуть эту аудиторию — отдельная ветка со своим
// набором полей (что реально проверяемо для локальной работы: график,
// работодатель, отзывы), не подмешивание в общий фид с полями, которые для
// неё пустые по определению.
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
  // Добавлено 16.08.2026, с 17.08.2026 — на ВСЕХ терминах без исключения
  // (правило зафиксировано в CLAUDE.md: регион применяется ко всем осям
  // импорта, терминам и whitelist работодателей одинаково). До 17.08.2026
  // пять "общих" терминов (lagerarbetare/chaufför/svetsare/elektriker/
  // montör) искали по всей Швеции — оказалось, что это тот же локальный
  // поток, ради ухода от которого убирали care: без региона chaufför и
  // lagerarbetare — местная развозка и склады со шведским по умолчанию,
  // не помощь целевой аудитории.
  regionRestricted?: boolean;
}

// 17.08.2026: эти шесть терминов ("общие", изначально без региона) переведены
// на regionRestricted решением Шакро — региональный принцип применяется ко
// ВСЕМ осям импорта без исключения, не только к новым терминам стройки/
// спецтехники ниже. Обоснование по числам (проверено 16.08.2026): без региона
// эти пять — 150 объявлений по всей Швеции, housing 3/150 (2%), agreement
// 45/150 (30%), но swe строго требуется у 62/150 (41.3% — ВЫШЕ, чем в убранном
// care-сегменте), и только 5/150 в Norrbotten+Västerbotten — тот же локальный
// поток (местная развозка, местные склады), ради ухода от которого убирали
// care. В регионе отдельно — 94 объявления, housing 2.1%, agreement 18% —
// заметно слабее новых терминов ниже, но не ноль. målare — тот же профиль,
// что у убранного byggnadsarbetare (1 в Norrbotten, 0 в Västerbotten из 140
// по стране), просто живее на юге; без региона затащил бы южношведских
// маляров, не целевую аудиторию.
export const OCCUPATIONS: Occupation[] = [
  {
    term: "lagerarbetare",
    regionRestricted: true,
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
    regionRestricted: true,
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
    regionRestricted: true,
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
    regionRestricted: true,
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
    regionRestricted: true,
    labels: {
      lv: "Montieris",
      ru: "Монтажник",
      en: "Fitter / assembler",
      lt: "Montuotojas",
      et: "Montöör",
    },
    noKeywords: ["montør"],
  },
  // Добавлен 17.08.2026 при разборе судьбы 5 старых вакансий "Målare" (маляр
  // — попали в базу ещё по списку категорий до dead0aa/14.08.2026, формально
  // сейчас ни под одним термином, отсюда и вопрос). По содержанию — обычная
  // строительная специальность, не care (kollektivavtal 27.5% на выборке 40),
  // но региональный сигнал слабый — см. общий комментарий выше про
  // regionRestricted для всех шести терминов в этой группе.
  {
    term: "målare",
    regionRestricted: true,
    labels: {
      lv: "Krāsotājs",
      ru: "Маляр",
      en: "Painter",
      lt: "Dažytojas",
      et: "Maalritööline",
    },
    noKeywords: ["maler"],
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
