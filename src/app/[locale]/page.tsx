import type { Metadata } from "next";
import Link from "next/link";
import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";
import { ScrollToJobs } from "@/components/ScrollToJobs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { VacancyCard } from "@/components/VacancyCard";
import { VerificationLegend } from "@/components/VerificationLegend";
import { isEnabledLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildAlternates, localeHref } from "@/i18n/href";
import { interpolate } from "@/i18n/format";
import { getVacancies } from "@/lib/vacancies";
import { countryLabel, isKnownCountryCode } from "@/lib/countries";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return {
    title: dict.meta.home.title,
    description: dict.meta.home.description,
    alternates: { languages: buildAlternates("/") },
  };
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; country?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isEnabledLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = await getDictionary(locale);

  const vacancies = await getVacancies(locale);
  const { q: rawQuery, country: rawCountry } = await searchParams;
  const query = (rawQuery ?? "").trim();
  const country = rawCountry && isKnownCountryCode(rawCountry) ? rawCountry : "";
  const isFiltered = query !== "" || country !== "";

  const filteredVacancies = isFiltered
    ? vacancies.filter(
        (v) =>
          (query === "" || v.title.toLowerCase().includes(query.toLowerCase())) &&
          (country === "" || v.country === country)
      )
    : vacancies;

  const filterLabel = [query && `«${query}»`, country && countryLabel(dict, country)]
    .filter(Boolean)
    .join(" · ");

  const trustPoints = [dict.home.trust.point1, dict.home.trust.point2, dict.home.trust.point3];

  return (
    <>
      <ScrollToJobs />
      <SiteHeader locale={locale} dict={dict} />

      <main>
        <section className="bg-accent-soft py-16 md:py-22">
          <div className="mx-auto grid w-[min(1120px,calc(100%-40px))] items-center gap-14 md:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
                {dict.home.hero.eyebrow}
              </div>
              <h1 className="my-4 text-[clamp(38px,5vw,64px)] leading-[1.02] font-extrabold tracking-[-0.05em]">
                {dict.home.hero.title}
              </h1>
              <p className="max-w-xl text-xl leading-relaxed text-muted">{dict.home.hero.subtitle}</p>

              <form
                action={localeHref(locale, "/#jobs")}
                className="mt-7 flex flex-col gap-1 rounded-xl border border-line bg-card p-1.5 shadow-lg shadow-deep/5 sm:flex-row"
              >
                <input
                  name="q"
                  defaultValue={query}
                  className="min-w-0 flex-1 bg-transparent p-3.5 text-sm outline-none"
                  placeholder={dict.home.hero.searchPlaceholder}
                />
                <select
                  name="country"
                  defaultValue={country}
                  className="min-w-0 flex-1 bg-transparent p-3.5 text-sm outline-none"
                >
                  <option value="">{dict.home.hero.countryAny}</option>
                  <option value="SE">{dict.common.country.SE}</option>
                  <option value="NO">{dict.common.country.NO}</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-5 py-3.5 text-center text-sm font-bold text-white"
                >
                  {dict.home.hero.submit}
                </button>
              </form>

              <p className="mt-3.5 text-xs text-muted">{dict.home.hero.disclaimer}</p>
            </div>

            {/* Демо-карточка: показывает формат, а не конкретное предложение. */}
            <div className="rounded-2xl bg-deep p-7 text-white shadow-xl shadow-deep/20">
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] text-emerald-200">
                {dict.home.demo.badge}
              </span>
              <div className="mt-7 mb-2 text-3xl font-extrabold tracking-tight">
                {dict.home.demo.title}
              </div>
              <div className="text-lg font-semibold">{dict.home.demo.jobTitle}</div>
              <div className="mt-2 text-sm text-white/70">{dict.home.demo.location}</div>
              <div className="mt-5 grid gap-2 border-t border-white/15 pt-4 text-sm text-white/80">
                <span>⌂ {dict.home.demo.housing}</span>
                <span>→ {dict.home.demo.travel}</span>
                <span>◷ {dict.home.demo.hours}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="jobs" className="mx-auto w-[min(1120px,calc(100%-40px))] py-18">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
                {dict.home.jobs.eyebrow}
              </div>
              <h2 className="mt-2 text-[34px] font-extrabold tracking-[-0.04em]">
                {dict.home.jobs.title}
              </h2>
            </div>
            <Link
              href={localeHref(locale, "/how-we-check")}
              className="text-sm whitespace-nowrap text-muted"
            >
              {dict.home.jobs.legendLink}
            </Link>
          </div>

          {vacancies.length === 0 ? (
            <div className="max-w-3xl rounded-2xl border border-dashed border-[#cbd8d8] bg-card p-8 text-center">
              <h3 className="text-xl font-semibold">{dict.home.jobs.emptyTitle}</h3>
              <p className="mx-auto mt-2.5 max-w-xl leading-relaxed text-muted">
                {dict.home.jobs.emptyText}
              </p>
              <Link
                href={localeHref(locale, "/services")}
                className="mt-5 inline-block rounded-lg bg-accent px-5 py-3 font-bold text-white"
              >
                {dict.home.jobs.emptyCta}
              </Link>
            </div>
          ) : isFiltered && filteredVacancies.length === 0 ? (
            // Нет совпадений — честно показываем «0», а не похожую карточку.
            // Соседский тест 14.08.2026 показал: подмена запроса на «похожее»
            // выглядит для пользователя как обман, даже с пояснением рядом.
            <div className="max-w-3xl rounded-2xl border border-dashed border-[#cbd8d8] bg-card p-8 text-center">
              <h3 className="text-xl font-semibold">{dict.home.jobs.noResultsTitle}</h3>
              <p className="mx-auto mt-2.5 max-w-xl leading-relaxed text-muted">
                {interpolate(dict.home.jobs.noResultsText, { filter: filterLabel })}
              </p>
              <Link
                href={localeHref(locale, "/#jobs")}
                className="mt-5 inline-block rounded-lg bg-accent px-5 py-3 font-bold text-white"
              >
                {dict.home.jobs.noResultsCta}
              </Link>
            </div>
          ) : (
            <>
              {isFiltered && (
                <p className="mb-4 text-sm text-muted">
                  {interpolate(dict.home.jobs.filtered, { filter: filterLabel })} ·{" "}
                  <Link href={localeHref(locale, "/#jobs")} className="text-accent">
                    {dict.home.jobs.reset}
                  </Link>
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                {filteredVacancies.map((v) => (
                  <VacancyCard key={v.id} v={v} locale={locale} dict={dict} />
                ))}
              </div>
            </>
          )}

          <div className="max-w-xl">
            <AlertSubscribeForm query={query} country={country} locale={locale} dict={dict} />
          </div>
        </section>

        <section className="bg-card py-16">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
                  {dict.home.legend.eyebrow}
                </div>
                <h2 className="mt-2 text-[34px] font-extrabold tracking-[-0.04em]">
                  {dict.home.legend.title}
                </h2>
              </div>
              <Link
                href={localeHref(locale, "/how-we-check")}
                className="text-sm whitespace-nowrap text-accent"
              >
                {dict.home.legend.link}
              </Link>
            </div>
            <VerificationLegend dict={dict} />
          </div>
        </section>

        <section id="how" className="mx-auto w-[min(1120px,calc(100%-40px))] py-16">
          <div className="grid gap-14 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
                {dict.home.trust.eyebrow}
              </div>
              <h2 className="mt-2 text-[34px] leading-tight font-extrabold tracking-[-0.04em]">
                {dict.home.trust.title}
              </h2>
            </div>
            <div className="grid gap-5">
              {trustPoints.map((point, i) => (
                <div
                  key={point}
                  className="grid grid-cols-[38px_1fr] gap-3 border-b border-line pb-4 last:border-b-0"
                >
                  <strong className="text-accent">{String(i + 1).padStart(2, "0")}</strong>
                  <span className="leading-relaxed text-muted">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="employer" className="bg-accent py-14 text-white">
          <div className="mx-auto flex w-[min(1120px,calc(100%-40px))] flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="text-[11px] font-extrabold tracking-[0.12em] text-emerald-100 uppercase">
                {dict.home.employer.eyebrow}
              </div>
              <h2 className="mt-2 text-[34px] font-extrabold tracking-[-0.04em]">
                {dict.home.employer.title}
              </h2>
              <p className="mt-3 text-emerald-50">{dict.home.employer.text}</p>
              <p className="mt-3 text-sm text-emerald-100">{dict.home.employer.note}</p>
            </div>
            <Link
              href={localeHref(locale, "/for-employers")}
              className="w-fit rounded-lg bg-white px-5 py-3.5 font-bold whitespace-nowrap text-accent"
            >
              {dict.home.employer.cta}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}
