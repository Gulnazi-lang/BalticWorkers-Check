export type VerificationLevel =
  | "NEEDS_REVIEW"
  | "SOURCE_CONFIRMED"
  | "EMPLOYER_CONFIRMED"
  | "WORKER_CONFIRMED";

export type PublicationType = "ORGANIC" | "SPONSORED" | "PARTNER";

export type ConditionStatus = "included" | "deducted" | "unknown";
// Для жилья можно честно сообщить, что оно доступно, не выдавая это за
// оплаченное жильё или удержание из зарплаты.
export type HousingStatus = ConditionStatus | "available";

export type EmployerAgreementStatus = "bound" | "not_bound" | "unknown";

export type AgreementLegalForce = "universally_binding" | "members_only";

/**
 * Различает "условия сверены редакцией/работодателем" от "объявление
 * упоминает какой-то договор, не называя его" — раньше обе формы попадали
 * в одно и то же collectiveAgreement (text) и рендерились на карточке
 * одинаково. exists_unnamed — реальная информация (минимум гарантирован
 * каким-то договором), но НЕ основание показывать конкретную ставку —
 * см. правило в CLAUDE.md, раздел про agreement_status.
 */
export type AgreementStatus = "named" | "exists_unnamed" | "unknown";

/** Тариф по коллективному договору — не зарплата вакансии, отдельный факт. */
export interface CollectiveAgreementRate {
  agreementCode: string;
  legalForce: AgreementLegalForce;
  sourceUrl: string;
  minAmount: number;
  currency: string;
  wageType: "gross_hour" | "gross_month";
}

export interface Vacancy {
  id: string;
  title: string;
  occupationTerm: string | null;
  occupationIsco: string | null;
  employerName: string | null;
  // country зеркалит public.countries — строка, а не union, чтобы новая
  // страна не требовала правки типов (см. src/lib/countries.ts).
  country: string;
  location: string | null;
  wageAmount: number | null;
  wageCurrency: string | null;
  wageType: "net_hour" | "gross_hour" | "gross_month" | null;
  housingStatus: HousingStatus;
  travelStatus: ConditionStatus;
  hoursPerWeek: number | null;
  collectiveAgreement: string | null;
  agreementStatus: AgreementStatus;
  collectiveAgreementRate: CollectiveAgreementRate | null;
  employerAgreementStatus: EmployerAgreementStatus | null;
  verificationLevel: VerificationLevel;
  publicationType: PublicationType;
  sourceUrl: string | null;
  sourceName: string | null;
  isDemo: boolean;
  updatedAt: string;
}

/** Строка таблицы public.vacancies — snake_case, как приходит из Supabase. */
export interface VacancyRow {
  id: string;
  title: string;
  occupation_term: string | null;
  occupation_isco: string | null;
  employer_name: string | null;
  country: string;
  location: string | null;
  wage_amount: number | null;
  wage_currency: string | null;
  wage_type: string | null;
  housing_status: string | null;
  travel_status: string | null;
  hours_per_week: number | null;
  collective_agreement: string | null;
  agreement_status: string | null;
  collective_agreement_id: string | null;
  employer_agreement_status: string | null;
  verification_level: VerificationLevel;
  publication_type: PublicationType;
  source_url: string | null;
  source_name: string | null;
  is_demo: boolean;
  updated_at: string;
}
