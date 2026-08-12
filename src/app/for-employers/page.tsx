import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Работодателям — NordicWork Check",
  description:
    "Перевод вакансии, проверка условий по единой процедуре и показ целевым кандидатам в Балтии. Оплата влияет на охват, а не на статус проверки.",
};

const CONTACT_EMAIL = "hello@nordicwork-check.example";

const SERVICES = [
  {
    title: "Перевод и оформление вакансии",
    text: "Переводим текст на русский и латышский, раскладываем условия по полям карточки: ставка, жильё, дорога, часы, договор.",
  },
  {
    title: "Продвижение среди кандидатов в Балтии",
    text: "Показываем вакансию целевой аудитории — по профессии и стране. Это и есть то, что покупается: охват.",
  },
  {
    title: "Проверка условий",
    text: "Входит в работу с каждой вакансией и делается одинаково для платных и бесплатных. Результат проверки не продаётся.",
  },
];

export default function ForEmployersPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-accent-soft py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
              Для работодателей
            </div>
            <h1 className="mt-3 max-w-3xl text-[clamp(32px,4vw,52px)] leading-[1.05] font-extrabold tracking-[-0.04em]">
              Нужны работники из Балтии?
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              Переведём вашу вакансию, проверим условия по единой процедуре и покажем её целевым
              кандидатам в Балтии.
            </p>
          </div>
        </section>

        <section id="services" className="mx-auto w-[min(1120px,calc(100%-40px))] py-14">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Что входит в услугу</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.title} className="rounded-2xl border border-line bg-card p-5">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-card p-6">
            <h3 className="text-lg font-extrabold">Что именно вы покупаете</h3>
            <p className="mt-2 leading-relaxed text-muted">
              Вы покупаете перевод вакансии и её охват среди кандидатов. Вы{" "}
              <span className="font-semibold text-ink">не покупаете</span> плашку проверки: статус
              ставит редакция по одной и той же процедуре для всех вакансий, платных и бесплатных.
              Оплата продвижения не влияет на результат проверки и не двигает карточку вверх в
              общем списке.
            </p>
            <p className="mt-3 text-sm text-muted">
              Как работает проверка —{" "}
              <Link href="/how-we-check" className="font-medium text-accent">
                вся процедура на отдельной странице
              </Link>
              .
            </p>
          </div>
        </section>

        <section id="post" className="bg-card py-14">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Разместить вакансию</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Пока принимаем заявки письмом. Пришлите ссылку на вакансию в официальном источнике и
              контакт ответственного — вернёмся с вопросами по условиям.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-line p-5">
                <h3 className="font-semibold">Что прислать</h3>
                <ul className="mt-3 grid gap-2 text-muted">
                  <li>· Ссылку на вакансию (Platsbanken, NAV или ваш сайт)</li>
                  <li>· Ставку и указать: нетто или брутто</li>
                  <li>· Жильё и дорога: оплачивается или вычитается из зарплаты</li>
                  <li>· Часы в неделю и коллективный договор, если есть</li>
                  <li>· Название компании в реестре и контакт ответственного</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-line p-5">
                <h3 className="font-semibold">Куда прислать</h3>
                <p className="mt-3 text-muted">
                  Письмо на адрес ниже. Отвечаем в рабочие дни.
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Вакансия для NordicWork Check")}`}
                  className="mt-4 inline-block rounded-lg bg-accent px-5 py-3.5 font-bold text-white"
                >
                  Написать нам
                </a>
                <p className="mt-3 text-sm text-muted">{CONTACT_EMAIL}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
