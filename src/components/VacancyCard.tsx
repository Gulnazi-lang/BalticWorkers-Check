import type { ConditionStatus, Vacancy } from "@/types/vacancy";
import { TONE_CLASS, VERIFICATION_LABELS } from "@/lib/status";

const COUNTRY_NAMES: Record<Vacancy["country"], string> = { SE: "Швеция", NO: "Норвегия" };

// Оригинал почти всегда на местном языке — предупреждаем заранее, а не
// оставляем человека один на один с непонятной страницей после перехода.
const SOURCE_LANGUAGE: Record<Vacancy["country"], string> = { SE: "шведском", NO: "норвежском" };

const WAGE_UNITS: Record<NonNullable<Vacancy["wageType"]>, string> = {
  net_hour: "нетто / час",
  gross_hour: "брутто / час",
  gross_month: "брутто / мес",
};

export function wageLabel(v: Vacancy): { value: string; note: string } {
  if (v.wageAmount == null) return { value: "Не указана", note: "" };
  return {
    value: `${v.wageAmount} ${v.wageCurrency ?? ""}`.trim(),
    note: v.wageType ? WAGE_UNITS[v.wageType] : "",
  };
}

/**
 * Условия показываем всегда, включая «вычитается»: удержание за жильё или
 * дорогу — красный флаг, который работник должен увидеть до поездки.
 */
export function conditionLine(label: string, status: ConditionStatus): string {
  if (status === "included") return `${label} оплачивается`;
  if (status === "deducted") return `${label} вычитается из зарплаты`;
  return `${label}: требует уточнения`;
}

export function VacancyCard({ v }: { v: Vacancy }) {
  const badge = VERIFICATION_LABELS[v.verificationLevel];
  const wage = wageLabel(v);

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-deep/10">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{COUNTRY_NAMES[v.country]}</span>
        <span className={`rounded-full px-3 py-1 text-[11px] ${TONE_CLASS[badge.tone]}`}>
          {badge.text}
        </span>
      </div>

      <h3 className="mt-5 text-lg leading-tight font-semibold">{v.title}</h3>
      <p className="mt-1 text-[13px] text-muted">{v.employerName ?? "Работодатель уточняется"}</p>
      <p className="text-[13px] text-muted">{v.location}</p>

      <div className="mt-5 mb-3">
        <div className="text-2xl font-extrabold tracking-tight">{wage.value}</div>
        {wage.note && <div className="mt-1 text-[11px] text-muted">{wage.note}</div>}
      </div>

      <div className="grid gap-2 border-t border-line pt-3 text-xs text-muted">
        <span>⌂ {conditionLine("Жильё", v.housingStatus)}</span>
        <span>→ {conditionLine("Дорога", v.travelStatus)}</span>
        {v.hoursPerWeek && <span>◷ {v.hoursPerWeek} ч / нед.</span>}
        {v.collectiveAgreement && <span>§ {v.collectiveAgreement}</span>}
      </div>

      <div className="mt-auto border-t border-line pt-3">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
          <span>{v.isDemo ? "Демонстрация" : `Обновлено ${v.updatedAt}`}</span>
          {v.sourceUrl && (
            <a
              href={v.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent"
            >
              Оригинал ↗
            </a>
          )}
        </div>
        {v.sourceUrl && (
          <p className="mt-1.5 text-[11px] text-muted">
            Страница на {SOURCE_LANGUAGE[v.country]} языке — включите перевод страницы в браузере
            (обычно предлагается сам).
          </p>
        )}
      </div>
    </article>
  );
}
