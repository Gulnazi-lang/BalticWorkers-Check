import type { ConditionStatus, HousingStatus, Vacancy } from "@/types/vacancy";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { DATE_LOCALE_TAG, interpolate } from "@/i18n/format";
import { ApplyHelp } from "@/components/ApplyHelp";
import { countryLabel } from "@/lib/countries";
import type { EcbRates } from "@/lib/ecbRates";
import { toEur } from "@/lib/ecbRates";
import {
  hasAmbiguousSeAgreement,
  occupationLabel,
  occupationLabelFromTitle,
  occupationTermFromTitle,
} from "@/lib/occupations";
import { TONE_CLASS, verificationLabels } from "@/lib/status";

/**
 * Справочный эквивалент в евро по курсу ЕЦБ — не для расчётов, только
 * чтобы не пересчитывать в голове. Дата курса всегда видна рядом.
 */
function eurApproxNote(
  amount: number,
  currency: string,
  rates: EcbRates | null,
  dict: Dictionary,
  locale: Locale
): string | null {
  if (!rates) return null;
  const eur = toEur(amount, currency, rates);
  if (eur == null) return null;
  const date = new Date(rates.date).toLocaleDateString(DATE_LOCALE_TAG[locale]);
  return interpolate(dict.vacancy.eurApprox, { amount: Math.round(eur), date });
}

const TARIFF_WAGE_UNIT_KEY: Record<"gross_hour" | "gross_month", "wageGrossHour" | "wageGrossMonth"> = {
  gross_hour: "wageGrossHour",
  gross_month: "wageGrossMonth",
};

/**
 * Тариф по коллективному договору — НЕ зарплата вакансии. Показываем
 * отдельным блоком, никогда не подставляем в wage.value: подмена значила
 * бы приписать работодателю обещание, которого он не давал.
 */
function tariffLine(v: Vacancy, dict: Dictionary): string | null {
  const rate = v.collectiveAgreementRate;
  if (!rate) return null;
  const unit = dict.vacancy[TARIFF_WAGE_UNIT_KEY[rate.wageType]];
  const vars = { code: rate.agreementCode, amount: rate.minAmount, currency: rate.currency, unit };
  return rate.legalForce === "universally_binding"
    ? interpolate(dict.vacancy.tariffNO, vars)
    : interpolate(dict.vacancy.tariffSE, vars);
}

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
  status: HousingStatus | ConditionStatus
): string {
  if (field === "housing") {
    if (status === "included") return dict.vacancy.housingIncluded;
    if (status === "deducted") return dict.vacancy.housingDeducted;
    if (status === "available") return dict.vacancy.housingAvailable;
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
  eurRates,
}: {
  v: Vacancy;
  locale: Locale;
  dict: Dictionary;
  eurRates: EcbRates | null;
}) {
  const labels = verificationLabels(dict);
  const badge = labels[v.verificationLevel];
  const wage = wageLabel(v, dict);
  const wageEurNote =
    v.wageAmount != null && v.wageCurrency
      ? eurApproxNote(v.wageAmount, v.wageCurrency, eurRates, dict, locale)
      : null;
  const tariffEurNote = v.collectiveAgreementRate
    ? eurApproxNote(
        v.collectiveAgreementRate.minAmount,
        v.collectiveAgreementRate.currency,
        eurRates,
        dict,
        locale
      )
    : null;
  // Headline из JobTech — свободный текст на языке источника (не только
  // должность, может включать город/работодателя). Переводим саму профессию
  // по фиксированному списку категорий импортёра, оригинал оставляем под ней.
  const translatedTitle =
    occupationLabel(v.occupationTerm, locale) ?? occupationLabelFromTitle(v.title, locale);
  const sourceLangNote = v.country === "SE" ? dict.vacancy.sourceLangNoteSE : dict.vacancy.sourceLangNoteNO;
  const tariff = tariffLine(v, dict);
  // Предупреждение о нарушении минимума имеет смысл только в Норвегии —
  // там тариф юридически обязателен для любого работодателя. В Швеции
  // договор связывает только присоединившихся, так что цифра ниже тарифа
  // не обязательно нарушение — просто показываем обе рядом, без алармизма.
  // Сравнивать можно только цифры в одной валюте и с одним типом ставки —
  // иначе "17 EUR/мес" против "230 NOK/час" дало бы бессмысленный вывод.
  const belowTariffWarning =
    v.collectiveAgreementRate?.legalForce === "universally_binding" &&
    v.wageAmount != null &&
    v.wageCurrency === v.collectiveAgreementRate.currency &&
    v.wageType === v.collectiveAgreementRate.wageType &&
    v.wageAmount < v.collectiveAgreementRate.minAmount
      ? dict.vacancy.tariffBelowMinimumNO
      : null;
  // В Швеции договор определяет работодатель, не профессия — при
  // отсутствии подтверждённого collective_agreement_id (редакция ещё не
  // дошла до EMPLOYER_CONFIRMED) честнее предупредить, что договоров
  // несколько и ставка неизвестна, чем молчать или гадать какой договор.
  const showAmbiguousSeNote =
    v.country === "SE" &&
    !tariff &&
    hasAmbiguousSeAgreement(v.occupationTerm ?? occupationTermFromTitle(v.title) ?? "");

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-deep/10">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{countryLabel(dict, v.country)}</span>
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
        {wageEurNote && <div className="mt-0.5 text-[11px] text-muted">{wageEurNote}</div>}
      </div>

      {tariff && (
        <div className="mb-3 rounded-lg bg-bg px-3 py-2 text-[11px] leading-relaxed text-ink">
          <p>{tariff}</p>
          {tariffEurNote && <p className="mt-0.5 text-muted">{tariffEurNote}</p>}
          {belowTariffWarning && (
            <p className="mt-1 font-medium text-tone-amber-ink">{belowTariffWarning}</p>
          )}
          {v.collectiveAgreementRate && (
            <a
              href={v.collectiveAgreementRate.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-medium text-accent"
            >
              {dict.vacancy.tariffSourceLink}
            </a>
          )}
        </div>
      )}

      {showAmbiguousSeNote && (
        <div className="mb-3 rounded-lg bg-bg px-3 py-2 text-[11px] leading-relaxed text-muted">
          {dict.vacancy.tariffAmbiguousSE}
        </div>
      )}

      {/* exists_unnamed — намеренно НЕ в общей строке с housing/travel/hours:
          та строка про подтверждённые факты, эта — про факт, который есть,
          но не назван, ставку по нему показывать нельзя (см. CLAUDE.md,
          agreement_status). Отдельная приглушённая рамка, как и у
          showAmbiguousSeNote выше — тот же визуальный регистр «известно, но
          не разрешено до конца», не спутать с уверенной строкой § ниже. */}
      {v.agreementStatus === "exists_unnamed" && (
        <div className="mb-3 rounded-lg bg-bg px-3 py-2 text-[11px] leading-relaxed text-muted">
          {dict.vacancy.agreementExistsUnnamed}
        </div>
      )}

      <div className="grid gap-2 border-t border-line pt-3 text-xs text-muted">
        <span>⌂ {conditionLine(dict, "housing", v.housingStatus)}</span>
        <span>→ {conditionLine(dict, "travel", v.travelStatus)}</span>
        {v.hoursPerWeek && (
          <span>◷ {interpolate(dict.vacancy.hoursPerWeek, { hours: v.hoursPerWeek })}</span>
        )}
        {v.agreementStatus === "named" && v.collectiveAgreement && (
          <span>§ {v.collectiveAgreement}</span>
        )}
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
