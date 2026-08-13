-- NordicWork Check — схема БД
--
-- Ключевая идея: verification_level и publication_type — две независимые
-- колонки. Оплата меняет только publication_type. Статус проверки меняется
-- только редакцией. Связать их через оплату нельзя — этого пути нет в данных.

-- Уровень проверки условий вакансии (редакционный, НЕ покупается)
create type verification_level as enum (
  'NEEDS_REVIEW',       -- работодатель не идентифицирован / условия неизвестны
  'SOURCE_CONFIRMED',   -- вакансия найдена в официальном источнике, условия не проверены
  'EMPLOYER_CONFIRMED', -- работодатель проверен в реестре + условия подтверждены
  'WORKER_CONFIRMED'    -- подтверждено реальным отзывом работника с объекта
);

-- Тип публикации (ORGANIC бесплатно; SPONSORED/PARTNER — платно)
create type publication_type as enum (
  'ORGANIC',    -- обычная вакансия из открытого источника
  'SPONSORED',  -- работодатель оплатил продвижение/перевод/охват
  'PARTNER'     -- от партнёрского агентства
);

create table public.vacancies (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- содержание
  title              text not null,
  employer_name      text,               -- null если ещё не идентифицирован
  country            text not null,       -- 'SE' | 'NO'
  location           text,                -- 'Boden', 'Oslo region'
  occupation_isco    text,                -- ISCO/SSYK код для фильтрации

  -- условия (каждое поле отдельно — это и есть продукт)
  wage_amount        numeric,             -- null = «Не указана»
  wage_currency      text,                -- 'EUR' | 'SEK' | 'NOK'
  wage_type          text,                -- 'net_hour' | 'gross_hour' | 'gross_month'
  housing_status     text,                -- 'included' | 'deducted' | 'unknown'
  travel_status      text,                -- 'included' | 'deducted' | 'unknown'
  hours_per_week     int,
  collective_agreement text,              -- 'Byggavtalet' и т.п., null если неизвестно

  -- ДВА НЕЗАВИСИМЫХ ПОЛЯ — ядро бренда
  verification_level verification_level not null default 'NEEDS_REVIEW',
  publication_type   publication_type   not null default 'ORGANIC',

  -- источник
  source_url         text,                -- ссылка на оригинал (JobTech/NAV)
  source_name        text,                -- 'Arbetsförmedlingen' | 'NAV'
  external_id        text,                -- id в источнике, для дедупликации

  -- служебное
  is_demo            boolean not null default false,  -- демо-карточка, помечается в UI
  published          boolean not null default false
);

-- дедупликация вакансий из источников
create unique index vacancies_source_uq
  on public.vacancies (source_name, external_id)
  where external_id is not null;

-- быстрый публичный листинг
create index vacancies_public_idx
  on public.vacancies (published, country, verification_level, updated_at desc);

-- автообновление updated_at
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger vacancies_updated_at
  before update on public.vacancies
  for each row execute function set_updated_at();

-- RLS: публично читаемы только опубликованные; запись — сервисной ролью
alter table public.vacancies enable row level security;

create policy "public reads published"
  on public.vacancies for select
  using (published = true);

-- Проект создан с выключенным «Automatically expose new tables», поэтому права
-- на Data API выдаём явно. Только select: писать может лишь service_role.
grant select on public.vacancies to anon, authenticated;

-- INSERT/UPDATE/DELETE — только service_role (импортёр и админка через сервер).
-- Отдельную политику для anon НЕ создаём: покупка продвижения идёт через
-- серверный роут, который меняет ТОЛЬКО publication_type. verification_level
-- в этом роуте не трогается вообще — гарантия на уровне кода бэкенда.

-- Отзывы работников — отдельная таблица.
-- WORKER_CONFIRMED выставляется только когда есть проверенный отзыв.
create table public.worker_reports (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  vacancy_id   uuid references public.vacancies(id),
  employer_name text,
  worked_period text,          -- 'весна 2026'
  wage_confirmed text,         -- что по факту платили
  housing_note text,
  verified     boolean not null default false,  -- редакция подтвердила подлинность
  contact_hint text            -- как связались (для внутренней проверки)
);

alter table public.worker_reports enable row level security;

create policy "public reads verified reports"
  on public.worker_reports for select
  using (verified = true);

-- Колоночный grant: contact_hint (как связались с работником) остаётся
-- внутренним и наружу не отдаётся даже для verified-отзывов.
grant select (id, created_at, vacancy_id, employer_name, worked_period,
              wage_confirmed, housing_note)
  on public.worker_reports to anon, authenticated;

-- Партнёрские реферальные ссылки: /go/[slug] -> контакт партнёра, с учётом
-- клика. Комиссия (если появится) идёт по отдельному договору с партнёром —
-- в схеме этого поля нет намеренно, деньги здесь не считаются автоматически.

create table public.partners (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,       -- 'accountant', 'id06-specialist'
  name        text not null,
  description text not null,
  contact_url text not null,              -- mailto: или https:, куда редиректим
  active      boolean not null default true
);

alter table public.partners enable row level security;

create policy "public reads active partners"
  on public.partners for select
  using (active = true);

grant select on public.partners to anon, authenticated;

-- Лог кликов: посетитель может записать свой переход, но не читать чужие —
-- это внутренняя аналитика, не публичные данные. Подсчёт — вручную в Table
-- Editor (дашборд подключается напрямую, RLS не мешает владельцу проекта).
create table public.partner_clicks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  partner_id  uuid not null references public.partners(id),
  source_page text
);

alter table public.partner_clicks enable row level security;

create policy "anyone can record a click"
  on public.partner_clicks for insert
  with check (true);

grant insert on public.partner_clicks to anon, authenticated;

-- Партнёры-заглушки: реального партнёра ещё нет, ссылка ведёт на общий
-- контактный email. Заменить contact_url в Table Editor, когда появится
-- настоящий партнёр и договорённость о комиссии.
insert into public.partners (slug, name, description, contact_url) values
  ('accountant', 'Бухгалтер-партнёр',
   'Разбор вопросов по налогам и декларации перед поездкой или во время работы.',
   'mailto:hello@nordicwork-check.example'),
  ('id06-specialist', 'Специалист по A1 и ID06',
   'Поможет понять, какие документы нужны для легальной работы на объекте.',
   'mailto:hello@nordicwork-check.example');
