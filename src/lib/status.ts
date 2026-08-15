import type { Dictionary } from "@/i18n/dictionaries";
import type { VerificationLevel } from "@/types/vacancy";

export type Tone = "green" | "blue" | "amber";

const TONE_BY_LEVEL: Record<VerificationLevel, Tone> = {
  WORKER_CONFIRMED: "green",
  EMPLOYER_CONFIRMED: "green",
  SOURCE_CONFIRMED: "blue",
  NEEDS_REVIEW: "amber",
};

export const TONE_CLASS: Record<Tone, string> = {
  green: "bg-tone-green-bg text-tone-green-ink",
  blue: "bg-tone-blue-bg text-tone-blue-ink",
  amber: "bg-tone-amber-bg text-tone-amber-ink",
};

/** Подписи статусов — из словаря локали, чтобы не расходились по сайту. */
export function verificationLabels(
  dict: Dictionary
): Record<VerificationLevel, { text: string; tone: Tone }> {
  return {
    WORKER_CONFIRMED: {
      text: dict.verification.labelWorkerConfirmed,
      tone: TONE_BY_LEVEL.WORKER_CONFIRMED,
    },
    EMPLOYER_CONFIRMED: {
      text: dict.verification.labelEmployerConfirmed,
      tone: TONE_BY_LEVEL.EMPLOYER_CONFIRMED,
    },
    SOURCE_CONFIRMED: {
      text: dict.verification.labelSourceConfirmed,
      tone: TONE_BY_LEVEL.SOURCE_CONFIRMED,
    },
    NEEDS_REVIEW: {
      text: dict.verification.labelNeedsReview,
      tone: TONE_BY_LEVEL.NEEDS_REVIEW,
    },
  };
}

/**
 * Легенда статусов: короткий блок на главной + полная таблица на /how-we-check.
 * Порядок — от самого сильного подтверждения к самому слабому.
 */
export function verificationLegend(
  dict: Dictionary
): { level: VerificationLevel; meaning: string; checked: string }[] {
  return [
    {
      level: "WORKER_CONFIRMED",
      meaning: dict.verification.meaningWorkerConfirmed,
      checked: dict.verification.checkedWorkerConfirmed,
    },
    {
      level: "EMPLOYER_CONFIRMED",
      meaning: dict.verification.meaningEmployerConfirmed,
      checked: dict.verification.checkedEmployerConfirmed,
    },
    {
      level: "SOURCE_CONFIRMED",
      meaning: dict.verification.meaningSourceConfirmed,
      checked: dict.verification.checkedSourceConfirmed,
    },
    {
      level: "NEEDS_REVIEW",
      meaning: dict.verification.meaningNeedsReview,
      checked: dict.verification.checkedNeedsReview,
    },
  ];
}
