@AGENTS.md

# NordicWork Check

Платформа проверенных вакансий в Швеции и Норвегии для работников из Балтии.
Статус: MVP-витрина, домен и Supabase-проект ещё не заведены.

## Стек
TypeScript, Next.js 16 (App Router), React 19, Tailwind v4, Supabase (SDK `@supabase/ssr`), деплой Vercel.
Структура скопирована с `Apps/DUD-DAGI/dagi-app` — там же смотреть образцы (auth, middleware, push).

## Что где
- `src/app/page.tsx` — главная: hero, вакансии, легенда статусов, доверие, блок работодателя.
- `src/app/how-we-check/page.tsx` — методика проверки, полная легенда.
- `src/app/services/page.tsx` — помощь работникам через партнёров + граница ответственности.
- `src/app/for-employers/page.tsx` — услуги + заявка на размещение (пока mailto).
- `src/lib/status.ts` — **единственный** источник подписей и тонов статусов.
- `src/lib/vacancies.ts` — выдача вакансий: Supabase, если заданы env; иначе демо-данные.
- `src/types/vacancy.ts` — `Vacancy` (camelCase, UI) и `VacancyRow` (snake_case, БД).
- `supabase/schema.sql` — схема, применяется вручную в SQL Editor.

## Ядро бренда — не ломать
`verification_level` и `publication_type` — **две независимые колонки**.
- `verification_level` меняет только редакция (сервисной ролью).
- `publication_type` меняет оплата.
- Серверный роут оплаты не должен касаться `verification_level` вообще. Пути «купить плашку» не существует ни в данных, ни в коде.
- Порядок выдачи в `getVacancies()` не зависит от `publication_type`.
- Условия показываем всегда, включая `deducted` («жильё вычитается из зарплаты») — это красный флаг для работника.
- Демо-карточки помечаются `is_demo` и подписью «Демонстрация»: пример нельзя выдавать за проверенную вакансию.

## Конвенции
- Server Components по умолчанию, `"use client"` только для интерактива.
- Мутации — Server Actions; route handlers только для вебхуков и импортёра.
- Цвета только через токены из `globals.css` (`accent`, `deep`, `tone-*`), не хардкодить hex в компонентах.
- Тексты русские; латышская/эстонская локали — следующий этап (брать next-intl из MajasBalss).

## Чего нельзя
- Не хардкодить статус проверки в компонентах в обход `VERIFICATION_LABELS`.
- Не давать anon-роли права на запись в `vacancies`.
- Не заявлять «проверено», если проверки не было: неизвестное поле = `unknown`.

## История структуры
До 13.08.2026 проект жил в корневом `app/` на обычном CSS (Next 15). Перенесён в `src/` на
Tailwind + Supabase по скиллу gelvua-apps; содержимое страниц `/services` и `/how-we-check` из
коммита `516d99f` перенесено в новую структуру. Старый `app/`, `lib/jobs.ts`, `components/jobs/`
удалены — если что-то понадобится, смотреть в git по этому коммиту.

## Не сделано (следующие шаги)
1. Supabase-проект + применить `supabase/schema.sql`, заполнить `.env.local`.
2. Импортёр вакансий: JobTech (SE) и NAV (NO) → дедупликация по `(source_name, external_id)`.
3. Поиск в hero сейчас нерабочий (ведёт якорем к списку) — нужен каталог `/vacancies` с фильтрами.
4. Форма работодателя вместо mailto + админка модерации.
5. Домен и Vercel.
