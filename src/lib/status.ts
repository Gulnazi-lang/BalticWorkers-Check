import type { VerificationLevel } from "@/types/vacancy";

export type Tone = "green" | "blue" | "amber";

/** Подписи статусов — в одном месте, чтобы не расходились по сайту. */
export const VERIFICATION_LABELS: Record<VerificationLevel, { text: string; tone: Tone }> = {
  WORKER_CONFIRMED: { text: "Подтверждено работником", tone: "green" },
  EMPLOYER_CONFIRMED: { text: "Условия подтверждены", tone: "green" },
  SOURCE_CONFIRMED: { text: "Источник найден", tone: "blue" },
  NEEDS_REVIEW: { text: "Проверка нужна", tone: "amber" },
};

export const TONE_CLASS: Record<Tone, string> = {
  green: "bg-tone-green-bg text-tone-green-ink",
  blue: "bg-tone-blue-bg text-tone-blue-ink",
  amber: "bg-tone-amber-bg text-tone-amber-ink",
};

/**
 * Легенда статусов: короткий блок на главной + полная таблица на /how-we-check.
 * Порядок — от самого сильного подтверждения к самому слабому.
 */
export const VERIFICATION_LEGEND: {
  level: VerificationLevel;
  meaning: string;
  checked: string;
}[] = [
  {
    level: "WORKER_CONFIRMED",
    meaning: "На этом объекте реально работал человек из Балтии и подтвердил условия",
    checked: "Есть проверенный отзыв работника",
  },
  {
    level: "EMPLOYER_CONFIRMED",
    meaning: "Работодатель найден в реестре, ставка и условия сверены",
    checked: "Реестр компании + коллективный договор + жильё/дорога не скрыты",
  },
  {
    level: "SOURCE_CONFIRMED",
    meaning: "Вакансия есть в официальном источнике, но условия не проверены",
    checked: "Только наличие в JobTech/NAV",
  },
  {
    level: "NEEDS_REVIEW",
    meaning: "Работодатель не идентифицирован",
    checked: "Пока ничего — показываем честно",
  },
];
