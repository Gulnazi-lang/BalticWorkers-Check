import type { ConditionStatus, Vacancy, VacancyRow } from "@/types/vacancy";
import type { Locale } from "@/i18n/config";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const DATE_LOCALE: Record<Locale, string> = {
  lv: "lv-LV",
  ru: "ru-RU",
  en: "en-GB",
  lt: "lt-LT",
  et: "et-EE",
};

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
    verificationLevel: "NEEDS_REVIEW",
    publicationType: "ORGANIC",
    sourceUrl: null,
    sourceName: null,
    isDemo: true,
    updatedAt: "сегодня",
  },
];

const CONDITIONS: ConditionStatus[] = ["included", "deducted", "unknown"];

function toCondition(value: string | null): ConditionStatus {
  return CONDITIONS.find((c) => c === value) ?? "unknown";
}

function fromRow(row: VacancyRow, locale: Locale): Vacancy {
  return {
    id: row.id,
    title: row.title,
    occupationTerm: row.occupation_term,
    employerName: row.employer_name,
    country: row.country === "NO" ? "NO" : "SE",
    location: row.location,
    wageAmount: row.wage_amount,
    wageCurrency: row.wage_currency,
    wageType: row.wage_type as Vacancy["wageType"],
    housingStatus: toCondition(row.housing_status),
    travelStatus: toCondition(row.travel_status),
    hoursPerWeek: row.hours_per_week,
    collectiveAgreement: row.collective_agreement,
    verificationLevel: row.verification_level,
    publicationType: row.publication_type,
    sourceUrl: row.source_url,
    sourceName: row.source_name,
    isDemo: row.is_demo,
    updatedAt: new Date(row.updated_at).toLocaleDateString(DATE_LOCALE[locale]),
  };
}

/**
 * Опубликованные вакансии. Порядок выдачи НЕ зависит от publication_type:
 * платное продвижение влияет на охват вне витрины, но не подменяет проверку
 * и не переставляет карточки вперёд.
 */
export async function getVacancies(locale: Locale, limit = 12): Promise<Vacancy[]> {
  if (!isSupabaseConfigured()) return DEMO_VACANCIES;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vacancies")
    .select("*")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  // База подключена — она и есть источник правды. Пусто значит пусто: главная
  // покажет блок «Первые вакансии готовятся», а не демо-карточки.
  if (error) {
    console.error("Не удалось прочитать вакансии:", error.message);
    return [];
  }
  return (data as VacancyRow[]).map((row) => fromRow(row, locale));
}
