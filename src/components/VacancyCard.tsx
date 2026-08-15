import type { ConditionStatus, Vacancy } from "@/types/vacancy";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { interpolate } from "@/i18n/format";
import { ApplyHelp } from "@/components/ApplyHelp";
import { occupationLabel, occupationLabelFromTitle } from "@/lib/occupations";
import { TONE_CLASS, verificationLabels } from "@/lib/status";

const WAGE_UNIT_KEY: Record<
  NonNullable<Vacancy["wageType"]>,
  "wageNetHour" | "wageGrossHour" | "wageGrossMonth"
> = {
  net_hour: "wageNetHour",
  gross_hour: "wageGrossHour",
  gross_month: "wageGrossMonth",
};

export function wageLabel(v: Vacancy, dict: Dictionary): { value: string; note: string } {
  if (v.wageAmount == null) return { value: dict.vacancy.wageNotSpecified, note: "" };
  return {
    value: `${v.wageAmount} ${v.wageCurrency ?? ""}`.trim(),
    note: v.wageType ? dict.vacancy[WAGE_UNIT_KEY[v.wageType]] : "",
  };
}

/**
 * Условия показываем всегда, включая «вычитается»: удержание за жильё или
 * дорогу — красный флаг, который работник должен увидеть до поездки.
 */
export function conditionLine(
  dict: Dictionary,
  field: "housing" | "travel",
  status: ConditionStatus
): string {
  if (field === "housing") {
    if (status === "included") return dict.vacancy.housingIncluded;
    if (status === "deducted") return dict.vacancy.housingDeducted;
    return dict.vacancy.housingUnknown;
  }
  if (status === "included") return dict.vacancy.travelIncluded;
  if (status === "deducted") return dict.vacancy.travelDeducted;
  return dict.vacancy.travelUnknown;
}

function sourceLabel(v: Vacancy, dict: Dictionary): string {
  if (v.isDemo) return dict.vacancy.demoSource;
  if (v.sourceName) return interpolate(dict.vacancy.sourceNamed, { source: v.sourceName });
  return dict.vacancy.sourceUnnamed;
}

export function VacancyCard({
  v,
  locale,
  dict,
}: {
  v: Vacancy;
  locale: Locale;
  dict: Dictionary;
}) {
  const labels = verificationLabels(dict);
  const badge = labels[v.verificationLevel];
  const wage = wageLabel(v, dict);
  // Headline из JobTech — свободный текст на языке источника (не только
  // должность, может включать город/работодателя). Переводим саму профессию
  // по фиксированному списку категорий импортёра, оригинал оставляем под ней.
  const translatedTitle =
    occupationLabel(v.occupationTerm, locale) ?? occupationLabelFromTitle(v.title, locale);
  const sourceLangNote = v.country === "SE" ? dict.vacancy.sourceLangNoteSE : dict.vacancy.sourceLangNoteNO;

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-deep/10">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{dict.common.country[v.country]}</span>
        <span className={`rounded-full px-3 py-1 text-[11px] ${TONE_CLASS[badge.tone]}`}>
          {badge.text}
        </span>
      </div>

      <h3 className="mt-5 text-lg leading-tight font-semibold">{translatedTitle ?? v.title}</h3>
      {translatedTitle && <p className="mt-0.5 text-[11px] text-muted italic">{v.title}</p>}
      <p className="mt-1 text-[13px] text-muted">{v.employerName ?? dict.vacancy.employerUnknown}</p>
      <p className="text-[13px] text-muted">{v.location}</p>

      <div className="mt-5 mb-3">
        <div className="text-2xl font-extrabold tracking-tight">{wage.value}</div>
        {wage.note && <div className="mt-1 text-[11px] text-muted">{wage.note}</div>}
      </div>

      <div className="grid gap-2 border-t border-line pt-3 text-xs text-muted">
        <span>⌂ {conditionLine(dict, "housing", v.housingStatus)}</span>
        <span>→ {conditionLine(dict, "travel", v.travelStatus)}</span>
        {v.hoursPerWeek && (
          <span>◷ {interpolate(dict.vacancy.hoursPerWeek, { hours: v.hoursPerWeek })}</span>
        )}
        {v.collectiveAgreement && <span>§ {v.collectiveAgreement}</span>}
      </div>

      {(v.housingStatus === "unknown" || v.travelStatus === "unknown" || !v.hoursPerWeek) && (
        <p className="mt-3 rounded-lg bg-tone-amber-bg px-3 py-2 text-[11px] leading-relaxed text-tone-amber-ink">
          {dict.vacancy.unconfirmedWarning}
        </p>
      )}

      <div className="mt-auto border-t border-line pt-3">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
          <span>
            {v.isDemo ? dict.vacancy.demo : interpolate(dict.vacancy.updated, { date: v.updatedAt })}
          </span>
          {v.sourceUrl && (
            <a
              href={v.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent"
            >
              {dict.vacancy.original}
            </a>
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted">{sourceLabel(v, dict)}</p>
        {v.sourceUrl && (
          <>
            <p className="mt-1.5 text-[11px] text-muted">{sourceLangNote}</p>
            <ApplyHelp sourceUrl={v.sourceUrl} dict={dict} />
          </>
        )}
      </div>
    </article>
  );
}
