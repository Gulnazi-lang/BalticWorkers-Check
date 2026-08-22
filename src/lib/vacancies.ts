import type {
  AgreementLegalForce,
  AgreementStatus,
  CollectiveAgreementRate,
  LegalMinimumRate,
  ConditionStatus,
  EmployerAgreementStatus,
  HousingStatus,
  Vacancy,
  VacancyRow,
} from "@/types/vacancy";
import type { Locale } from "@/i18n/config";
import { DATE_LOCALE_TAG } from "@/i18n/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { agreementCodeForTerm, occupationTermFromTitle } from "@/lib/occupations";

const EMPLOYER_AGREEMENT_STATUSES: EmployerAgreementStatus[] = ["bound", "not_bound", "unknown"];
const LEGAL_FORCES: AgreementLegalForce[] = ["universally_binding", "members_only"];

/**
 * Демо-карточки до подключения Supabase. Все помечены isDemo — в UI это
 * видно подписью «Демонстрация», чтобы витрина не выдавала пример за проверенную
 * вакансию. Ни у одной нет sourceUrl на конкретное объявление: ссылка на общую
 * страницу поиска биржи труда — тупик для пользователя, честнее не давать её.
 */
export const DEMO_VACANCIES: Vacancy[] = [
  {
    id: "boden-cable-installer",
    title: "Монтажник кабельных систем",
    occupationTerm: null,
    occupationIsco: null,
    employerName: null,
    country: "SE",
    location: "Boden",
    wageAmount: 17,
    wageCurrency: "€",
    wageType: "net_hour",
    housingStatus: "included",
    travelStatus: "included",
    hoursPerWeek: 40,
    collectiveAgreement: null,
    agreementStatus: "unknown",
    collectiveAgreementRate: null,
    legalMinimumStatus: "unknown",
    legalMinimumSector: null,
    legalMinimumRate: null,
    employerAgreementStatus: null,
    verificationLevel: "EMPLOYER_CONFIRMED",
    publicationType: "ORGANIC",
    sourceUrl: null,
    sourceName: null,
    isDemo: true,
    updatedAt: "сегодня",
  },
  {
    id: "boden-welder",
    title: "Сварщик и монтажник",
    occupationTerm: null,
    occupationIsco: null,
    employerName: "TUSA Energi AB",
    country: "SE",
    location: "Boden",
    wageAmount: null,
    wageCurrency: null,
    wageType: null,
    housingStatus: "unknown",
    travelStatus: "unknown",
    hoursPerWeek: null,
    collectiveAgreement: null,
    agreementStatus: "unknown",
    collectiveAgreementRate: null,
    legalMinimumStatus: "unknown",
    legalMinimumSector: null,
    legalMinimumRate: null,
    employerAgreementStatus: null,
    verificationLevel: "SOURCE_CONFIRMED",
    publicationType: "ORGANIC",
    // Реальной ссылки на конкретное объявление нет — до импортёра JobTech её
    // взять неоткуда. Ссылка на общую страницу поиска биржи труда — тупик для
    // пользователя, поэтому лучше честно не давать её вовсе.
    sourceUrl: null,
    sourceName: "Arbetsförmedlingen",
    isDemo: true,
    updatedAt: "сегодня",
  },
  {
    id: "norway-construction",
    title: "Строительный рабочий",
    occupationTerm: null,
    occupationIsco: null,
    employerName: null,
    country: "NO",
    location: "Oslo region",
    wageAmount: null,
    wageCurrency: null,
    wageType: null,
    housingStatus: "unknown",
    travelStatus: "unknown",
    hoursPerWeek: null,
    collectiveAgreement: null,
    agreementStatus: "unknown",
    collectiveAgreementRate: null,
    legalMinimumStatus: "possible",
    legalMinimumSector: "construction",
    legalMinimumRate: null,
    employerAgreementStatus: null,
    verificationLevel: "NEEDS_REVIEW",
    publicationType: "ORGANIC",
    sourceUrl: null,
    sourceName: null,
    isDemo: true,
    updatedAt: "сегодня",
  },
];

const CONDITIONS: ConditionStatus[] = ["included", "deducted", "unknown"];
const HOUSING_STATUSES: HousingStatus[] = ["included", "deducted", "available", "unknown"];

function toCondition(value: string | null): ConditionStatus {
  return CONDITIONS.find((c) => c === value) ?? "unknown";
}

function toHousingStatus(value: string | null): HousingStatus {
  return HOUSING_STATUSES.find((status) => status === value) ?? "unknown";
}

const AGREEMENT_STATUSES: AgreementStatus[] = ["named", "exists_unnamed", "unknown"];

function toAgreementStatus(value: string | null): AgreementStatus {
  return AGREEMENT_STATUSES.find((s) => s === value) ?? "unknown";
}

function toEmployerAgreementStatus(value: string | null): EmployerAgreementStatus | null {
  return EMPLOYER_AGREEMENT_STATUSES.find((s) => s === value) ?? null;
}

function toLegalForce(value: string): AgreementLegalForce | null {
  return LEGAL_FORCES.find((f) => f === value) ?? null;
}

/** Форма строки из запроса с join на collective_agreements/rates. */
interface VacancyRowWithAgreement extends VacancyRow {
  collective_agreements: {
    code: string;
    legal_force: string;
    source_url: string;
    collective_agreement_rates: {
      min_amount: number;
      currency: string;
      wage_type: string;
    }[];
  } | null;
  legal_minimum_rate: {
    min_amount: number;
    currency: string;
    wage_type: string;
    valid_from: string;
    source_url: string;
  } | null;
}

function toLegalMinimumRate(row: VacancyRowWithAgreement): LegalMinimumRate | null {
  if (row.legal_minimum_status !== "confirmed") return null;
  const rate = row.legal_minimum_rate;
  if (!rate || (rate.wage_type !== "gross_hour" && rate.wage_type !== "gross_month")) return null;
  return { minAmount: rate.min_amount, currency: rate.currency, wageType: rate.wage_type,
    validFrom: rate.valid_from, sourceUrl: rate.source_url };
}

function toAgreementRate(row: VacancyRowWithAgreement): CollectiveAgreementRate | null {
  // Правило, зафиксированное в CLAUDE.md: расчёт/показ тарифной ставки
  // работает только при agreement_status = 'named'. Дублирует CHECK-
  // констрейнт в БД (015_agreement_status.sql) на уровне чтения — так
  // правило переживёт будущие правки этой функции, а не только миграции.
  if (row.agreement_status !== "named") return null;
  const agreement = row.collective_agreements;
  const rate = agreement?.collective_agreement_rates?.[0];
  const legalForce = agreement ? toLegalForce(agreement.legal_force) : null;
  if (!agreement || !rate || !legalForce) return null;
  if (rate.wage_type !== "gross_hour" && rate.wage_type !== "gross_month") return null;
  return {
    agreementCode: agreement.code,
    legalForce,
    sourceUrl: agreement.source_url,
    minAmount: rate.min_amount,
    currency: rate.currency,
    wageType: rate.wage_type,
  };
}

/** code -> ставка, для вакансий без collective_agreement_id (ещё не переимпортированы). */
type AgreementFallbackMap = Map<string, CollectiveAgreementRate>;

/**
 * Только legal_force = 'universally_binding' (норвежское allmenngjøring) —
 * см. подробное объяснение в resolveAgreements.ts. Для 'members_only'
 * (Швеция) вывод по профессии структурно неверен: договор определяет
 * конкретный работодатель, не категория вакансии — такую привязку
 * проставляет только редакция вручную на шаге EMPLOYER_CONFIRMED.
 */
async function fetchAgreementFallbackMap(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AgreementFallbackMap> {
  const { data } = await supabase
    .from("collective_agreements")
    .select(
      "code, country, legal_force, source_url, collective_agreement_rates ( min_amount, currency, wage_type )"
    )
    .eq("legal_force", "universally_binding");
  const map: AgreementFallbackMap = new Map();
  for (const a of data ?? []) {
    const rate = a.collective_agreement_rates?.[0];
    const legalForce = toLegalForce(a.legal_force);
    if (!rate || !legalForce) continue;
    if (rate.wage_type !== "gross_hour" && rate.wage_type !== "gross_month") continue;
    map.set(`${a.country}:${a.code}`, {
      agreementCode: a.code,
      legalForce,
      sourceUrl: a.source_url,
      minAmount: rate.min_amount,
      currency: rate.currency,
      wageType: rate.wage_type,
    });
  }
  return map;
}

/**
 * Привязка occupation_term -> договор статическая (см. agreementCodeForTerm),
 * значит для вакансий, импортированных ДО появления collective_agreement_id,
 * ждать переимпорт не нужно — тот же принцип, что и с переводом профессии:
 * привязку мы делаем сами, cron тут ни при чём. Но fallbackMap уже
 * отфильтрован по universally_binding, так что для Швеции эта функция
 * структурно ничего не найдёт — там нужен реальный collective_agreement_id
 * из БД, который проставляет только редакция.
 */
function resolveAgreementRate(
  row: VacancyRowWithAgreement,
  fallbackMap: AgreementFallbackMap
): CollectiveAgreementRate | null {
  const direct = toAgreementRate(row);
  if (direct) return direct;
  const term = row.occupation_term ?? occupationTermFromTitle(row.title);
  const code = term ? agreementCodeForTerm(term) : null;
  return code ? (fallbackMap.get(`${row.country}:${code}`) ?? null) : null;
}

function fromRow(
  row: VacancyRowWithAgreement,
  locale: Locale,
  fallbackMap: AgreementFallbackMap
): Vacancy {
  return {
    id: row.id,
    title: row.title,
    occupationTerm: row.occupation_term,
    occupationIsco: row.occupation_isco,
    employerName: row.employer_name,
    country: row.country,
    location: row.location,
    wageAmount: row.wage_amount,
    wageCurrency: row.wage_currency,
    wageType: row.wage_type as Vacancy["wageType"],
    housingStatus: toHousingStatus(row.housing_status),
    travelStatus: toCondition(row.travel_status),
    hoursPerWeek: row.hours_per_week,
    collectiveAgreement: row.collective_agreement,
    agreementStatus: toAgreementStatus(row.agreement_status),
    collectiveAgreementRate: resolveAgreementRate(row, fallbackMap),
    legalMinimumStatus: row.legal_minimum_status === "confirmed" || row.legal_minimum_status === "possible" ? row.legal_minimum_status : "unknown",
    legalMinimumSector: row.legal_minimum_sector,
    legalMinimumRate: toLegalMinimumRate(row),
    employerAgreementStatus: toEmployerAgreementStatus(row.employer_agreement_status),
    verificationLevel: row.verification_level,
    publicationType: row.publication_type,
    sourceUrl: row.source_url,
    sourceName: row.source_name,
    isDemo: row.is_demo,
    updatedAt: new Date(row.updated_at).toLocaleDateString(DATE_LOCALE_TAG[locale]),
  };
}

export interface VacancyFilters {
  occupationIsco?: string;
  country?: string;
}

/**
 * Живая вакансия для героя на главной — заменяет прежнюю хардкод демо-
 * карточку (см. CLAUDE.md, «Герой на главной»). Правило отбора: среди самых
 * свежих published-вакансий берём те, где заполнено минимум
 * HERO_MIN_FILLED_FIELDS из пяти ключевых полей — иначе герой выглядел бы
 * пусто, — и ротируем случайно среди HERO_POOL_SIZE самых свежих из них.
 * Пустое поле НЕ повод исключить вакансию отовсюду, только из героя:
 * VacancyCard и так честно показывает unknown как «нужно уточнить» —
 * герой просто выбирает более наглядный пример для первого экрана.
 *
 * Случайный выбор на каждом рендере, не детерминированная ротация по дате:
 * `/[locale]` уже рендерится динамически (HomePage принимает searchParams),
 * статический кеш здесь рвать нечего.
 */
const HERO_FIELD_TESTS: ((v: Vacancy) => boolean)[] = [
  (v) => v.wageAmount != null,
  (v) => v.housingStatus !== "unknown",
  (v) => v.travelStatus !== "unknown",
  (v) => v.hoursPerWeek != null,
  // exists_unnamed засчитывается наравне с named: "Lön enligt kollektivavtal"
  // без названия — реальная информация (минимум чем-то гарантирован), не
  // пустышка. Решение зафиксировано в CLAUDE.md.
  (v) => v.agreementStatus !== "unknown",
];
const HERO_MIN_FILLED_FIELDS = 3;
const HERO_POOL_SIZE = 5;
// Насколько вглубь по свежести искать 3-5 подходящих кандидатов — не весь
// published-фид: одна богатая полями, но давно не обновлявшаяся вакансия
// иначе обошла бы правило «свежайшие среди подходящих».
const HERO_CANDIDATE_WINDOW = 40;

function heroFilledCount(v: Vacancy): number {
  return HERO_FIELD_TESTS.filter((test) => test(v)).length;
}

export async function getHeroVacancy(locale: Locale): Promise<Vacancy | null> {
  let pool: Vacancy[];

  if (!isSupabaseConfigured()) {
    pool = DEMO_VACANCIES;
  } else {
    const supabase = await createClient();
    const query = supabase
      .from("vacancies")
      .select(
        `*, collective_agreements ( code, legal_force, source_url, collective_agreement_rates ( min_amount, currency, wage_type ) ), legal_minimum_rate:collective_agreement_rates!vacancies_legal_minimum_rate_id_fkey ( min_amount, currency, wage_type, valid_from, source_url )`
      )
      .eq("published", true)
      .eq("is_demo", false)
      .order("updated_at", { ascending: false })
      .limit(HERO_CANDIDATE_WINDOW);

    const [{ data, error }, fallbackMap] = await Promise.all([
      query,
      fetchAgreementFallbackMap(supabase),
    ]);
    if (error) {
      console.error("Не удалось прочитать вакансию для героя:", error.message);
      return null;
    }
    pool = (data as unknown as VacancyRowWithAgreement[]).map((row) =>
      fromRow(row, locale, fallbackMap)
    );
  }

  // pool уже отсортирован по updated_at desc (запросом или порядком в
  // DEMO_VACANCIES) — filter сохраняет порядок, freshest-first не теряется.
  const qualifying = pool.filter((v) => heroFilledCount(v) >= HERO_MIN_FILLED_FIELDS);
  if (qualifying.length === 0) return null;

  const candidates = qualifying.slice(0, HERO_POOL_SIZE);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Опубликованные вакансии. Порядок выдачи НЕ зависит от publication_type:
 * платное продвижение влияет на охват вне витрины, но не подменяет проверку
 * и не переставляет карточки вперёд.
 *
 * Фильтры применяются в самом запросе к базе, а не после — список профессий
 * в поиске строится из occupation_counts и гарантированно непуст для
 * каждого пункта (см. src/lib/occupationOptions.ts); если бы фильтрация шла
 * по уже выбранным limit последним вакансиям, реальные совпадения за
 * пределами этого окна просто не находились бы, и гарантия ломалась.
 */
export async function getVacancies(
  locale: Locale,
  filters: VacancyFilters = {},
  limit = 12
): Promise<Vacancy[]> {
  if (!isSupabaseConfigured()) return DEMO_VACANCIES;

  const supabase = await createClient();

  let query = supabase
    .from("vacancies")
    .select(
      `*, collective_agreements ( code, legal_force, source_url, collective_agreement_rates ( min_amount, currency, wage_type ) ), legal_minimum_rate:collective_agreement_rates!vacancies_legal_minimum_rate_id_fkey ( min_amount, currency, wage_type, valid_from, source_url )`
    )
    .eq("published", true);
  if (filters.occupationIsco) query = query.eq("occupation_isco", filters.occupationIsco);
  if (filters.country) query = query.eq("country", filters.country);
  query = query.order("updated_at", { ascending: false }).limit(limit);

  const [{ data, error }, fallbackMap] = await Promise.all([
    query,
    fetchAgreementFallbackMap(supabase),
  ]);

  // База подключена — она и есть источник правды. Пусто значит пусто: главная
  // покажет блок «Первые вакансии готовятся», а не демо-карточки.
  if (error) {
    console.error("Не удалось прочитать вакансии:", error.message);
    return [];
  }
  return (data as unknown as VacancyRowWithAgreement[]).map((row) =>
    fromRow(row, locale, fallbackMap)
  );
}
