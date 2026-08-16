-- Вакансии, снятые по просьбе работодателя.
--
-- Зачем: на /employers/sv и /employers/nb есть обещание «не хотите
-- показываться — уберём вакансию». Без этой таблицы импортёр возвращал бы
-- снятую вакансию при следующем прогоне, то есть обещание держалось бы
-- только на том, что никто не запустит импорт.
--
-- Ключ здесь (source_name, external_id) — ровно те же колонки, что и в
-- vacancies и в уникальном индексе vacancies_source_uq. Не 'jobtech'/'nav':
-- в vacancies.source_name лежат 'Arbetsförmedlingen' и 'NAV', и заводить
-- второй словарь имён источников значило бы поддерживать маппинг между
-- ними ради одной таблицы.
--
-- ДВА уровня исключения, и это не избыточность:
--   * external_id   — конкретное объявление;
--   * employer_name — все объявления работодателя в этом источнике.
-- Проверено на живом API 16.08.2026: id у JobTech это глобальный
-- возрастающий счётчик (за полгода 30 646 364 → 31 356 660, корреляция с
-- датой публикации 0.97, дублей нет), у NAV — uuid. То есть id никогда не
-- переиспользуется, и исключение по нему безопасно — но повторная
-- публикация той же вакансии получает НОВЫЙ id и мимо такого исключения
-- проходит. Работодатель, который просит его не показывать, обычно имеет
-- в виду себя, а не один конкретный номер объявления, — поэтому нужен и
-- второй уровень.
--
-- Заполняется руками через Supabase Studio: обращения приходят на
-- baltworkers@gmail.com письмами, потока, который оправдал бы форму на
-- сайте, пока нет.

create table public.excluded_vacancies (
  id            uuid primary key default gen_random_uuid(),

  source_name   text not null,        -- как в vacancies.source_name
  external_id   text,                 -- одно объявление; null = не по объявлению
  employer_name text,                 -- все объявления работодателя; null = не по нему

  reason        text,                 -- свободный текст для редакции
  requested_by  text,                 -- email обратившегося, для аудита
  created_at    timestamptz not null default now(),

  -- Пустая запись исключила бы всё подряд из источника.
  constraint excluded_vacancies_target_ck
    check (external_id is not null or employer_name is not null)
);

-- Частичные — чтобы запись «по работодателю» (external_id is null) не
-- конфликтовала сама с собой, и наоборот. Дают повторной попытке исключить
-- то же самое честный on conflict do nothing вместо дубля.
create unique index excluded_vacancies_ad_uq
  on public.excluded_vacancies (source_name, external_id)
  where external_id is not null;

create unique index excluded_vacancies_employer_uq
  on public.excluded_vacancies (source_name, lower(employer_name))
  where employer_name is not null;

-- Не публичные данные (в reason/requested_by может быть переписка с
-- работодателем) — читает и пишет только сервисная роль.
-- service_role обходит RLS, но НЕ обычный GRANT: без явного grant Data API
-- таблицу не увидит. Проект создан с выключенным «Automatically expose new
-- tables», так что это обязательный шаг, а не перестраховка.
alter table public.excluded_vacancies enable row level security;
grant select, insert, update, delete on public.excluded_vacancies to service_role;
