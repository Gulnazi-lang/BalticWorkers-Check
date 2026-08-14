import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPartnerStatuses } from "@/lib/partners";

export const metadata: Metadata = {
  title: "Помощь через партнёров — NordicWork Check",
  description:
    "Объясним, какие вопросы задать работодателю, и сведём с профильным специалистом: договор, A1 и ID06, налоги.",
};

const HELP: { title: string; text: string; partnerSlug?: string }[] = [
  {
    title: "Перед поездкой",
    text: "Чек-лист договора, жилья, дороги, зарплаты и командирования: что спросить до того, как соглашаться.",
  },
  {
    title: "A1 и ID06",
    text: "Поможем понять, какие документы нужны, и направим к партнёру, который оказывает услугу.",
    partnerSlug: "id06-specialist",
  },
  {
    title: "Налоги и декларация",
    text: "Объясним общую последовательность и сведём с бухгалтером для персональной консультации.",
    partnerSlug: "accountant",
  },
];

export default async function ServicesPage() {
  const partnerSlugs = HELP.map((item) => item.partnerSlug).filter((slug) => slug != null);
  const partnerStatuses = await getPartnerStatuses(partnerSlugs);

  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-accent-soft py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
              Для работников
            </div>
            <h1 className="mt-3 max-w-3xl text-[clamp(32px,4vw,52px)] leading-[1.05] font-extrabold tracking-[-0.04em]">
              Поможем разобраться с документами
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              Объясним, какие вопросы задать работодателю, и при необходимости сведём вас с
              профильным специалистом.
            </p>
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <div className="grid gap-4 md:grid-cols-3">
            {HELP.map((item) => {
              const status = item.partnerSlug ? partnerStatuses[item.partnerSlug] : null;
              return (
                <div key={item.title} className="rounded-2xl border border-line bg-card p-5">
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 leading-relaxed text-muted">{item.text}</p>
                  {item.partnerSlug && status?.isPlaceholder && (
                    <>
                      <p className="mt-4 text-sm text-muted">
                        Партнёра пока подключаем. Оставьте заявку — сообщим, когда появится
                        специалист.
                      </p>
                      <a
                        href={`/go/${item.partnerSlug}?from=services`}
                        className="mt-2 inline-block text-sm font-medium text-accent"
                      >
                        Оставить заявку →
                      </a>
                    </>
                  )}
                  {item.partnerSlug && status && !status.isPlaceholder && (
                    <>
                      <a
                        href={`/go/${item.partnerSlug}?from=services`}
                        className="mt-4 inline-block text-sm font-medium text-accent"
                      >
                        Написать партнёру →
                      </a>
                      <p className="mt-2 text-xs text-muted">
                        Партнёрская рекомендация. NordicWork Check может получить комиссию за
                        обращение. Услугу оказывает партнёр.
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 max-w-3xl rounded-2xl border border-dashed border-[#cbd8d8] bg-card p-7">
            <h2 className="text-xl font-extrabold">Важная граница ответственности</h2>
            <p className="mt-3 leading-relaxed text-muted">
              NordicWork Check не оформляет A1, не подаёт налоговые декларации и не выдаёт
              юридические заключения. Мы помогаем разобраться и направляем к специалисту, который
              отвечает за конкретную услугу.
            </p>
            <p className="mt-4 text-sm text-muted">
              Как устроена проверка вакансий —{" "}
              <Link href="/how-we-check" className="font-medium text-accent">
                на странице методики
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
