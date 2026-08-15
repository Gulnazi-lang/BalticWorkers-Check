import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isEnabledLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildAlternates, localeHref } from "@/i18n/href";

const CONTACT_EMAIL = "hello@balticworkers-check.example";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return {
    title: dict.meta.forEmployers.title,
    description: dict.meta.forEmployers.description,
    alternates: { languages: buildAlternates("/for-employers") },
  };
}

export default async function ForEmployersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isEnabledLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = await getDictionary(locale);

  const services = [
    { title: dict.forEmployers.service1Title, text: dict.forEmployers.service1Text },
    { title: dict.forEmployers.service2Title, text: dict.forEmployers.service2Text },
    { title: dict.forEmployers.service3Title, text: dict.forEmployers.service3Text },
  ];

  return (
    <>
      <SiteHeader locale={locale} dict={dict} />

      <main>
        <section className="bg-accent-soft py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
              {dict.forEmployers.eyebrow}
            </div>
            <h1 className="mt-3 max-w-3xl text-[clamp(32px,4vw,52px)] leading-[1.05] font-extrabold tracking-[-0.04em]">
              {dict.forEmployers.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{dict.forEmployers.subtitle}</p>
          </div>
        </section>

        <section id="services" className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
            {dict.forEmployers.servicesTitle}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="rounded-2xl border border-line bg-card p-5">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-card p-6">
            <h3 className="text-lg font-extrabold">{dict.forEmployers.buyingTitle}</h3>
            <p className="mt-2 leading-relaxed text-muted">
              {dict.forEmployers.buyingTextBefore}{" "}
              <span className="font-semibold text-ink">{dict.forEmployers.buyingTextEmphasis}</span>{" "}
              {dict.forEmployers.buyingTextAfter}
            </p>
            <p className="mt-3 text-sm text-muted">
              {dict.forEmployers.checkNoteBefore}{" "}
              <Link href={localeHref(locale, "/how-we-check")} className="font-medium text-accent">
                {dict.forEmployers.checkNoteLink}
              </Link>
              .
            </p>
          </div>
        </section>

        <section id="post" className="bg-card py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
              {dict.forEmployers.postTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-muted">{dict.forEmployers.postText}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-line p-5">
                <h3 className="font-semibold">{dict.forEmployers.sendTitle}</h3>
                <ul className="mt-3 grid gap-2 text-muted">
                  <li>· {dict.forEmployers.send1}</li>
                  <li>· {dict.forEmployers.send2}</li>
                  <li>· {dict.forEmployers.send3}</li>
                  <li>· {dict.forEmployers.send4}</li>
                  <li>· {dict.forEmployers.send5}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-line p-5">
                <h3 className="font-semibold">{dict.forEmployers.whereTitle}</h3>
                <p className="mt-3 text-muted">{dict.forEmployers.whereText}</p>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(dict.forEmployers.mailSubject)}`}
                  className="mt-4 inline-block rounded-lg bg-accent px-5 py-3.5 font-bold text-white"
                >
                  {dict.forEmployers.whereCta}
                </a>
                <p className="mt-3 text-sm text-muted">{CONTACT_EMAIL}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}
