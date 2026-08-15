export type VerificationLevel =
  | "NEEDS_REVIEW"
  | "SOURCE_CONFIRMED"
  | "EMPLOYER_CONFIRMED"
  | "WORKER_CONFIRMED";

export type PublicationType = "ORGANIC" | "SPONSORED" | "PARTNER";

export type ConditionStatus = "included" | "deducted" | "unknown";

export interface Vacancy {
  id: string;
  title: string;
  occupationTerm: string | null;
  employerName: string | null;
  country: "SE" | "NO";
  location: string | null;
  wageAmount: number | null;
  wageCurrency: string | null;
  wageType: "net_hour" | "gross_hour" | "gross_month" | null;
  housingStatus: ConditionStatus;
  travelStatus: ConditionStatus;
  hoursPerWeek: number | null;
  collectiveAgreement: string | null;
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
  verification_level: VerificationLevel;
  publication_type: PublicationType;
  source_url: string | null;
  source_name: string | null;
  is_demo: boolean;
  updated_at: string;
}
