import Link from "next/link";
import { ScrollToJobs } from "@/components/ScrollToJobs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { VacancyCard } from "@/components/VacancyCard";
import { VerificationLegend } from "@/components/VerificationLegend";
import { getVacancies } from "@/lib/vacancies";

const TRUST_POINTS = [
  "Показываем реального работодателя и ссылку на официальный источник.",
  "Отдельно указываем зарплату, жильё, дорогу — и честно помечаем, что ещё не проверено.",
  "Не берём плату с работника за доступ к вакансиям. Никогда.",
];

const COUNTRY_NAMES: Record<string, string> = { SE: "Швеция", NO: "Норвегия" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string }>;
}) {
  const vacancies = await getVacancies();
  const { q: rawQuery, country: rawCountry } = await searchParams;
  const query = (rawQuery ?? "").trim();
  const country = rawCountry === "SE" || rawCountry === "NO" ? rawCountry : "";
  const isFiltered = query !== "" || country !== "";

  const filteredVacancies = isFiltered
    ? vacancies.filter(
        (v) =>
          (query === "" || v.title.toLowerCase().includes(query.toLowerCase())) &&
          (country === "" || v.country === country)
      )
    : vacancies;

  const filterLabel = [query && `«${query}»`, country && COUNTRY_NAMES[country]]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <ScrollToJobs />
      <SiteHeader />

      <main>
        <section className="bg-accent-soft py-16 md:py-22">
          <div className="mx-auto grid w-[min(1120px,calc(100%-40px))] items-center gap-14 md:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
                Швеция · Норвегия · Балтия
              </div>
              <h1 className="my-4 text-[clamp(38px,5vw,64px)] leading-[1.02] font-extrabold tracking-[-0.05em]">
                Работа в Скандинавии с понятными условиями
              </h1>
              <p className="max-w-xl text-xl leading-relaxed text-muted">
                Зарплата, жильё, дорога и работодатель — всё в одной карточке. Мы проверяем условия
                до того, как вы поедете.
              </p>

              <form
                action="/#jobs"
                className="mt-7 flex flex-col gap-1 rounded-xl border border-line bg-card p-1.5 shadow-lg shadow-deep/5 sm:flex-row"
              >
                <input
                  name="q"
                  defaultValue={query}
                  className="min-w-0 flex-1 bg-transparent p-3.5 text-sm outline-none"
                  placeholder="Профессия, например: сварщик"
                />
                <select
                  name="country"
                  defaultValue={country}
                  className="min-w-0 flex-1 bg-transparent p-3.5 text-sm outline-none"
                >
                  <option value="">Страна</option>
                  <option value="SE">Швеция</option>
                  <option value="NO">Норвегия</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-5 py-3.5 text-center text-sm font-bold text-white"
                >
                  Найти работу
                </button>
              </form>

              <p className="mt-3.5 text-xs text-muted">
                Бесплатно для соискателей · Отклик через официальный источник · Мы не берём плату за
                доступ к вакансиям
              </p>
            </div>

            {/* Демо-карточка: показывает формат, а не конкретное предложение. */}
            <div className="rounded-2xl bg-deep p-7 text-white shadow-xl shadow-deep/20">
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] text-emerald-200">
                Демонстрация
              </span>
              <div className="mt-7 mb-2 text-3xl font-extrabold tracking-tight">Пример карточки</div>
              <div className="text-lg font-semibold">Монтажник кабельных систем</div>
              <div className="mt-2 text-sm text-white/70">Boden, Швеция</div>
              <div className="mt-5 grid gap-2 border-t border-white/15 pt-4 text-sm text-white/80">
                <span>⌂ Жильё — отдельной строкой</span>
                <span>→ Дорога — отдельной строкой</span>
                <span>◷ Часы в неделю и договор</span>
              </div>
            </div>
          </div>
        </section>

        <section id="jobs" className="mx-auto w-[min(1120px,calc(100%-40px))] py-18">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
                Подборка вакансий
              </div>
              <h2 className="mt-2 text-[34px] font-extrabold tracking-[-0.04em]">
                Последние предложения
              </h2>
            </div>
            <Link href="/how-we-check" className="text-sm whitespace-nowrap text-muted">
              Что значат плашки →
            </Link>
          </div>

          {vacancies.length === 0 ? (
            <div className="max-w-3xl rounded-2xl border border-dashed border-[#cbd8d8] bg-card p-8 text-center">
              <h3 className="text-xl font-semibold">Первые вакансии готовятся</h3>
              <p className="mx-auto mt-2.5 max-w-xl leading-relaxed text-muted">
                Мы подключаем источники и проверяем условия вручную. Здесь появятся вакансии с
                указанием зарплаты, жилья, дороги и работодателя.
              </p>
              <Link
                href="/services"
                className="mt-5 inline-block rounded-lg bg-accent px-5 py-3 font-bold text-white"
              >
                Пока посмотреть, что спросить у работодателя
              </Link>
            </div>
          ) : isFiltered && filteredVacancies.length === 0 ? (
            // Нет совпадений — честно показываем «0», а не похожую карточку.
            // Соседский тест 14.08.2026 показал: подмена запроса на «похожее»
            // выглядит для пользователя как обман, даже с пояснением рядом.
            <div className="max-w-3xl rounded-2xl border border-dashed border-[#cbd8d8] bg-card p-8 text-center">
              <h3 className="text-xl font-semibold">Найдено вакансий: 0</h3>
              <p className="mx-auto mt-2.5 max-w-xl leading-relaxed text-muted">
                Мы пока не нашли проверенное предложение по запросу {filterLabel}.
              </p>
              <Link
                href="/#jobs"
                className="mt-5 inline-block rounded-lg bg-accent px-5 py-3 font-bold text-white"
              >
                Посмотреть все открытые вакансии
              </Link>
            </div>
          ) : (
            <>
              {isFiltered && (
                <p className="mb-4 text-sm text-muted">
                  Совпадения по {filterLabel} · <Link href="/#jobs" className="text-accent">Сбросить</Link>
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                {filteredVacancies.map((v) => (
                  <VacancyCard key={v.id} v={v} />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="bg-card py-16">
          <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
                  Легенда статусов
                </div>
                <h2 className="mt-2 text-[34px] font-extrabold tracking-[-0.04em]">
                  Что означает плашка на карточке
                </h2>
              </div>
              <Link href="/how-we-check" className="text-sm whitespace-nowrap text-accent">
                Вся процедура →
              </Link>
            </div>
            <VerificationLegend />
          </div>
        </section>

        <section id="how" className="mx-auto w-[min(1120px,calc(100%-40px))] py-16">
          <div className="grid gap-14 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.12em] text-accent uppercase">
                Почему нам доверяют
              </div>
              <h2 className="mt-2 text-[34px] leading-tight font-extrabold tracking-[-0.04em]">
                Проверяем важное до поездки
              </h2>
            </div>
            <div className="grid gap-5">
              {TRUST_POINTS.map((point, i) => (
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
                Для работодателей
              </div>
              <h2 className="mt-2 text-[34px] font-extrabold tracking-[-0.04em]">
                Нужны работники из Балтии?
              </h2>
              <p className="mt-3 text-emerald-50">
                Переведём вашу вакансию, проверим условия по единой процедуре и покажем её целевым
                кандидатам в Балтии.
              </p>
              <p className="mt-3 text-sm text-emerald-100">
                Оплата продвижения не влияет на результат проверки. Все вакансии проходят одинаковую
                редакционную процедуру.
              </p>
            </div>
            <Link
              href="/for-employers"
              className="w-fit rounded-lg bg-white px-5 py-3.5 font-bold whitespace-nowrap text-accent"
            >
              Разместить вакансию
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
