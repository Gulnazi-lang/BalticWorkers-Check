import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { VerificationLegend } from "@/components/VerificationLegend";
import { isEnabledLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildAlternates, localeHref } from "@/i18n/href";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return {
    title: dict.meta.howWeCheck.title,
    description: dict.meta.howWeCheck.description,
    alternates: { languages: buildAlternates("/how-we-check") },
  };
}

export default async function HowWeCheckPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isEnabledLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = await getDictionary(locale);

  const steps = [
    { title: dict.howWeCheck.step1Title, text: dict.howWeCheck.step1Text },
    { title: dict.howWeCheck.step2Title, text: dict.howWeCheck.step2Text },
    { title: dict.howWeCheck.step3Title, text: dict.howWeCheck.step3Text },
    { title: dict.howWeCheck.step4Title, text: dict.howWeCheck.step4Text },
  ];

  return (
    <>
      <SiteHeader locale={locale} dict={dict} />

      <main>
        <section className="bg-accent-soft py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
              {dict.howWeCheck.eyebrow}
            </div>
            <h1 className="mt-3 max-w-3xl text-[clamp(32px,4vw,52px)] leading-[1.05] font-extrabold tracking-[-0.04em]">
              {dict.howWeCheck.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{dict.howWeCheck.subtitle}</p>
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
            {dict.howWeCheck.levelsTitle}
          </h2>
          <p className="mt-2 mb-6 max-w-2xl text-muted">{dict.howWeCheck.levelsText}</p>
          <VerificationLegend dict={dict} full />
        </section>

        <section className="bg-card py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
              {dict.howWeCheck.stepsTitle}
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {steps.map((step, i) => (
                <div key={step.title} className="rounded-2xl border border-line p-5">
                  <span className="text-[11px] font-extrabold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              {dict.howWeCheck.limitsTitle}
            </h2>
            <ul className="mt-4 grid gap-3 text-muted">
              <li>{dict.howWeCheck.limit1}</li>
              <li>{dict.howWeCheck.limit2}</li>
              <li>{dict.howWeCheck.limit3}</li>
              <li>{dict.howWeCheck.limit4}</li>
            </ul>
            <p className="mt-5 text-sm text-muted">
              {dict.howWeCheck.workerNoteBefore}{" "}
              <Link href={localeHref(locale, "/for-employers")} className="font-medium text-accent">
                {dict.howWeCheck.workerNoteLink}
              </Link>{" "}
              {dict.howWeCheck.workerNoteAfter}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}
