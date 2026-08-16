import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EMPLOYER_LANGS, isEmployerLang, type EmployerLang } from "@/i18n/employers/config";
import { getEmployerDictionary } from "@/i18n/employers/dictionary";

// Куда работодатель присылает условия. Второй адрес в копии, чтобы письмо
// не зависело от одного ящика.
const CONTACT_EMAIL = "baltworkers@gmail.com";
const CONTACT_EMAIL_CC = "gelvua@gmail.com";

// Ссылка «посмотреть, как это выглядит у нас» ведёт на английскую версию
// витрины, а не на локаль по умолчанию: коммуна на латышской главной
// увидит ровно ту проблему, из-за которой эта страница и появилась.
const SHOWCASE_HREF = "/en";

// Только sv и nb: чужой код языка отдаёт 404, а не пустую страницу.
export const dynamicParams = false;

export function generateStaticParams() {
  return EMPLOYER_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isEmployerLang(lang)) notFound();
  const dict = await getEmployerDictionary(lang);

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/employers/${lang}`,
      // sv и nb — переводы друг друга и больше ничего. Пять локалей сайта
      // сюда не подмешиваем: это разная аудитория и разный текст.
      languages: Object.fromEntries(
        EMPLOYER_LANGS.map((l) => [l, `/employers/${l}`])
      ),
    },
  };
}

export default async function EmployerLandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!isEmployerLang(rawLang)) notFound();
  const lang: EmployerLang = rawLang;
  const dict = await getEmployerDictionary(lang);

  const mailtoHref =
    `mailto:${CONTACT_EMAIL}` +
    `?cc=${encodeURIComponent(CONTACT_EMAIL_CC)}` +
    `&subject=${encodeURIComponent(dict.contact.mailSubject)}`;

  const whoPoints = [dict.who.point1, dict.who.point2, dict.who.point3];
  const whyPoints = [dict.why.point1, dict.why.point2, dict.why.point3];
  const askItems = [
    dict.ask.item1,
    dict.ask.item2,
    dict.ask.item3,
    dict.ask.item4,
    dict.ask.item5,
  ];
  const limits = [dict.limits.item1, dict.limits.item2, dict.limits.item3, dict.limits.item4];

  return (
    <>
      {/* Шапка без навигации и без переключателя языков: адресат пришёл по
          ссылке из письма, ему некуда идти по сайту — только ответить. */}
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex min-h-18 w-[min(1120px,calc(100%-40px))] flex-col justify-center gap-1 py-3">
          <div className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="grid h-8.5 w-8.5 place-items-center rounded-[10px] bg-deep text-[11px] text-white">
              BW
            </span>
            <span>
              BalticWorkers <span className="text-accent">Check</span>
            </span>
          </div>
          <p className="text-[13px] text-muted">{dict.header.tagline}</p>
        </div>
      </header>

      <main>
        <section className="bg-accent-soft py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
              {dict.hero.eyebrow}
            </div>
            <h1 className="mt-3 max-w-3xl text-[clamp(32px,4vw,52px)] leading-[1.05] font-extrabold tracking-[-0.04em]">
              {dict.hero.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{dict.hero.subtitle}</p>
            <a
              href={mailtoHref}
              className="mt-7 inline-block rounded-lg bg-accent px-5 py-3.5 font-bold text-white"
            >
              {dict.hero.cta}
            </a>
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{dict.who.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{dict.who.text}</p>
              <ul className="mt-4 grid gap-2 text-muted">
                {whoPoints.map((point) => (
                  <li key={point}>· {point}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">
                {dict.who.siteLinkBefore}{" "}
                <a href={SHOWCASE_HREF} className="font-medium text-accent">
                  {dict.who.siteLink}
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{dict.why.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{dict.why.text}</p>
              <ul className="mt-4 grid gap-2 text-muted">
                {whyPoints.map((point) => (
                  <li key={point}>· {point}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-card py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{dict.ask.title}</h2>
            <p className="mt-2 max-w-2xl text-muted">{dict.ask.text}</p>

            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {askItems.map((item) => (
                <li key={item} className="rounded-2xl border border-line p-5 text-muted">
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-5 max-w-2xl text-sm text-muted">{dict.ask.note}</p>
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{dict.limits.title}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {limits.map((item) => (
              <div key={item} className="rounded-2xl border border-line bg-card p-5 text-muted">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="bg-accent-soft py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{dict.contact.title}</h2>
            <p className="mt-2 max-w-2xl text-muted">{dict.contact.text}</p>
            <a
              href={mailtoHref}
              className="mt-6 inline-block rounded-lg bg-accent px-5 py-3.5 font-bold text-white"
            >
              {dict.contact.cta}
            </a>
            <p className="mt-4 text-sm text-muted">
              {CONTACT_EMAIL} · {CONTACT_EMAIL_CC}
            </p>
            <p className="mt-2 text-sm text-muted">{dict.contact.note}</p>
          </div>
        </section>
      </main>

      <footer className="bg-deep py-6 text-[12px] text-white/70">
        <div className="mx-auto flex w-[min(1120px,calc(100%-40px))] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{dict.footer.copyright}</span>
          <span>{dict.footer.tagline}</span>
        </div>
      </footer>
    </>
  );
}
