import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isEnabledLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildAlternates } from "@/i18n/href";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return {
    title: dict.meta.about.title,
    description: dict.meta.about.description,
    alternates: { languages: buildAlternates("/about") },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isEnabledLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = await getDictionary(locale);
  const t = dict.about;

  const dontItems = [t.dontItem1, t.dontItem2, t.dontItem3, t.dontItem4];

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
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{t.whoTitle}</h2>
              <p className="mt-3 leading-relaxed text-muted">{t.whoText}</p>
              <p className="mt-3 leading-relaxed text-muted">{t.whoText2}</p>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{t.whyTitle}</h2>
              <p className="mt-3 leading-relaxed text-muted">{t.whyText}</p>
              <p className="mt-3 leading-relaxed text-muted">{t.whyText2}</p>
            </div>
          </div>
        </section>

        <section className="bg-card py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{t.dontTitle}</h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {dontItems.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-line bg-bg p-5 leading-relaxed text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">{t.contactsTitle}</h2>
            <div className="mt-4 grid gap-1 text-muted">
              <p className="font-semibold text-ink">{t.companyName}</p>
              <p>{t.regNumber}</p>
              <p>{t.address}</p>
              <p className="mt-2">{t.founderLine}</p>
              <p className="mt-2">
                {t.emailLabel}{" "}
                <a href="mailto:baltworkers@gmail.com" className="font-medium text-accent">
                  baltworkers@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}
