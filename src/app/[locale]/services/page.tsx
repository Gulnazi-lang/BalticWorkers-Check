import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isEnabledLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildAlternates, localeHref } from "@/i18n/href";
import { getPartnerStatuses } from "@/lib/partners";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return {
    title: dict.meta.services.title,
    description: dict.meta.services.description,
    alternates: { languages: buildAlternates("/services") },
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isEnabledLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = await getDictionary(locale);

  const help: { title: string; text: string; partnerSlug?: string }[] = [
    { title: dict.services.item1Title, text: dict.services.item1Text },
    {
      title: dict.services.item2Title,
      text: dict.services.item2Text,
      partnerSlug: "id06-specialist",
    },
    {
      title: dict.services.item3Title,
      text: dict.services.item3Text,
      partnerSlug: "accountant",
    },
  ];

  const partnerSlugs = help.map((item) => item.partnerSlug).filter((slug) => slug != null);
  const partnerStatuses = await getPartnerStatuses(partnerSlugs);

  return (
    <>
      <SiteHeader locale={locale} dict={dict} />

      <main>
        <section className="bg-accent-soft py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
              {dict.services.eyebrow}
            </div>
            <h1 className="mt-3 max-w-3xl text-[clamp(32px,4vw,52px)] leading-[1.05] font-extrabold tracking-[-0.04em]">
              {dict.services.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{dict.services.subtitle}</p>
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <div className="grid gap-4 md:grid-cols-3">
            {help.map((item) => {
              const status = item.partnerSlug ? partnerStatuses[item.partnerSlug] : null;
              return (
                <div key={item.title} className="rounded-2xl border border-line bg-card p-5">
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 leading-relaxed text-muted">{item.text}</p>
                  {item.partnerSlug && status?.isPlaceholder && (
                    <>
                      <p className="mt-4 text-sm text-muted">{dict.services.partnerPending}</p>
                      <a
                        href={`/go/${item.partnerSlug}?from=services`}
                        className="mt-2 inline-block text-sm font-medium text-accent"
                      >
                        {dict.services.partnerPendingCta}
                      </a>
                    </>
                  )}
                  {item.partnerSlug && status && !status.isPlaceholder && (
                    <>
                      <a
                        href={`/go/${item.partnerSlug}?from=services`}
                        className="mt-4 inline-block text-sm font-medium text-accent"
                      >
                        {dict.services.partnerCta}
                      </a>
                      <p className="mt-2 text-xs text-muted">{dict.services.partnerDisclosure}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 max-w-3xl rounded-2xl border border-dashed border-[#cbd8d8] bg-card p-7">
            <h2 className="text-xl font-extrabold">{dict.services.boundaryTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted">{dict.services.boundaryText}</p>
            <p className="mt-4 text-sm text-muted">
              {dict.services.methodNoteBefore}{" "}
              <Link href={localeHref(locale, "/how-we-check")} className="font-medium text-accent">
                {dict.services.methodNoteLink}
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}
