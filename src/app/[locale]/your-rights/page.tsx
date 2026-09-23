import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isEnabledLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildAlternates } from "@/i18n/href";
import { NORWAY_UNIONS, SWEDEN_UNIONS, type UnionEntry } from "@/lib/unions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return {
    title: dict.meta.yourRights.title,
    description: dict.meta.yourRights.description,
    alternates: { languages: buildAlternates("/your-rights") },
  };
}

// Официальный источник ставок — тот же, что уже используется на карточке
// вакансии (VacancyCard.tsx, legalMinimumSource) для согласованности ссылок
// по сайту.
const ARBEIDSTILSYNET_MINIMUM_URL =
  "https://www.arbeidstilsynet.no/en/working-conditions/pay-and-minimum-rates-of-pay/minimum-wage/";
const NVA_LICENSED_URL = "https://www.nva.gov.lv/en/licensed-private-employment-agencies";
const NVA_LAW_URL = "https://likumi.lv/ta/id/62539-bezdarbnieku-un-darba-mekletaju-atbalsta-likums";
const ARBEIDSTILSYNET_URL = "https://www.arbeidstilsynet.no/";
const ARBETSMILJOVERKET_URL = "https://www.av.se/";

export default async function YourRightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isEnabledLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = await getDictionary(locale);
  const t = dict.yourRights;

  const sectorLabel = (key: UnionEntry["sectorKey"]) => t[key];

  const unionColumn = (heading: string, unions: readonly UnionEntry[]) => (
    <div>
      <h3 className="text-lg font-semibold">{heading}</h3>
      <ul className="mt-4 grid gap-3">
        {unions.map((u) => (
          <li
            key={`${u.sectorKey}-${u.union}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-line bg-bg px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">{u.union}</p>
              <p className="text-sm text-muted">{sectorLabel(u.sectorKey)}</p>
            </div>
            <a
              href={u.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm font-medium text-accent"
            >
              {t.joinLabel}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <SiteHeader locale={locale} dict={dict} />

      <main>
        <section className="bg-accent-soft py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
              {t.eyebrow}
            </div>
            <h1 className="mt-3 max-w-3xl text-[clamp(32px,4vw,52px)] leading-[1.05] font-extrabold tracking-[-0.04em]">
              {t.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{t.subtitle}</p>
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">{t.feesTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted">{t.feesText1}</p>
            <p className="mt-3 leading-relaxed text-muted">{t.feesText2}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href={NVA_LICENSED_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-accent">
                {t.feesLinkNva}
              </a>
              <a href={NVA_LAW_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-accent">
                {t.feesLinkLaw}
              </a>
            </div>
          </div>
        </section>

        <section className="bg-card py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">{t.minimumTitle}</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted">{t.minimumText1}</p>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted">{t.minimumText2}</p>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted">{t.minimumText3}</p>
            <a
              href={ARBEIDSTILSYNET_MINIMUM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-accent"
            >
              {t.minimumLink}
            </a>
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <h2 className="text-xl font-extrabold tracking-[-0.03em]">{t.unionsTitle}</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{t.unionsText}</p>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{t.unionsText2}</p>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{t.unionsText3}</p>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {unionColumn(t.norwayHeading, NORWAY_UNIONS)}
            {unionColumn(t.swedenHeading, SWEDEN_UNIONS)}
          </div>
        </section>

        <section className="bg-card py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">{t.ifNotPaidTitle}</h2>
                <p className="mt-3 leading-relaxed text-muted">
                  <a href={ARBEIDSTILSYNET_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-accent">
                    {t.ifNotPaidNorway}
                  </a>
                </p>
                <p className="mt-2 leading-relaxed text-muted">
                  <a href={ARBETSMILJOVERKET_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-accent">
                    {t.ifNotPaidSweden}
                  </a>
                </p>
                <p className="mt-3 leading-relaxed text-muted">{t.ifNotPaidUnionNote}</p>
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">{t.ifDifferentTitle}</h2>
                <p className="mt-3 leading-relaxed text-muted">{t.ifDifferentText}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}
