import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { VerificationLegend } from "@/components/VerificationLegend";

export const metadata: Metadata = {
  title: "Как проверяем — NordicWork Check",
  description:
    "Четыре уровня проверки вакансии: от «проверка нужна» до подтверждения работником. Что именно мы проверяем на каждом уровне.",
};

const STEPS = [
  {
    title: "Находим вакансию в официальном источнике",
    text: "Швеция — Platsbanken/JobTech Arbetsförmedlingen, Норвегия — NAV. Ссылку на оригинал показываем в карточке, отклик идёт туда же.",
  },
  {
    title: "Идентифицируем работодателя",
    text: "Сверяем название с реестром компаний (Bolagsverket, Brønnøysund). Если за вакансией стоит посредник, а не работодатель, — так и пишем.",
  },
  {
    title: "Разбираем условия по отдельности",
    text: "Зарплата (нетто или брутто), жильё, дорога, часы, коллективный договор. Каждое поле — отдельно; неизвестное помечаем как неизвестное, а не как «по договорённости».",
  },
  {
    title: "Собираем отзывы работников",
    text: "Если человек из Балтии реально работал на объекте и подтвердил условия — вакансия получает верхний статус. Отзыв проверяет редакция.",
  },
];

export default function HowWeCheckPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-accent-soft py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
              Методика
            </div>
            <h1 className="mt-3 max-w-3xl text-[clamp(32px,4vw,52px)] leading-[1.05] font-extrabold tracking-[-0.04em]">
              Как мы проверяем вакансии
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              Статус проверки ставит только редакция. Его нельзя купить: оплата продвижения меняет
              охват вакансии, но не её плашку.
            </p>
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Четыре уровня проверки</h2>
          <p className="mt-2 mb-6 max-w-2xl text-muted">
            Плашка на карточке отвечает на один вопрос: насколько далеко мы продвинулись в проверке
            именно этой вакансии.
          </p>
          <VerificationLegend full />
        </section>

        <section className="bg-card py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Что мы делаем по шагам</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {STEPS.map((step, i) => (
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
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">Чего мы не делаем и не обещаем</h2>
            <ul className="mt-4 grid gap-3 text-muted">
              <li>Не берём оплату с работника — ни за доступ, ни за отклик, ни за «приоритет».</li>
              <li>Не принимаем документы кандидата: отклик идёт напрямую в официальный источник.</li>
              <li>Не повышаем статус проверки за деньги — этого пути нет даже в структуре базы.</li>
              <li>
                Не гарантируем трудоустройство, визу, налоговый результат или уровень дохода. Мы
                объясняем опубликованные условия и направляем к оригинальному источнику.
              </li>
            </ul>
            <p className="mt-5 text-sm text-muted">
              Работали в Швеции или Норвегии и хотите подтвердить условия?{" "}
              <Link href="/for-employers" className="font-medium text-accent">
                Напишите нам
              </Link>{" "}
              — так появляется статус «Подтверждено работником».
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
