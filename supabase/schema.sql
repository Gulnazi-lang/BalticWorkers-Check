-- BalticWorkers Check — схема БД
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

-- дедупликация вакансий из источников. Обычный (не частичный) индекс — так он
-- годится как arbiter для "on conflict (source_name, external_id)" из
-- Supabase JS клиента; NULL и так не конфликтует с NULL в уникальных
-- индексах Postgres по умолчанию, поведение не меняется.
create unique index vacancies_source_uq
  on public.vacancies (source_name, external_id);

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
--
-- service_role обходит RLS, но не обычный GRANT — при выключенном "Automatically
-- expose new tables" это, похоже, касается и его. Без этой строки импортёр падал
-- с "permission denied for table vacancies", даже используя service_role key.
grant select, insert, update, delete on public.vacancies to service_role;

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
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  slug           text not null unique,       -- 'accountant', 'id06-specialist'
  name           text not null,
  description    text not null,
  contact_url    text not null,              -- mailto: или https:, куда редиректим
  is_active      boolean not null default true,
  -- Пока true: реального специалиста ещё нет, contact_url ведёт на наш общий
  -- email как "оставить заявку", а не как прямая линия к партнёру. UI на
  -- /services обязан честно отражать это состояние — см. src/lib/partners.ts.
  is_placeholder boolean not null default true
);

alter table public.partners enable row level security;

create trigger partners_updated_at
  before update on public.partners
  for each row execute function set_updated_at();

create policy "public reads active partners"
  on public.partners for select
  using (is_active = true);

grant select on public.partners to anon, authenticated;

-- Лог кликов: посетитель может записать свой переход, но не читать чужие —
-- это внутренняя аналитика, не публичные данные. Подсчёт — вручную в Table
-- Editor (дашборд подключается напрямую, RLS не мешает владельцу проекта).
-- Явной "deny select"-политики не нужно: без SELECT-политики роль и так
-- ничего не прочитает — в Postgres RLS запрет по умолчанию.
create table public.partner_clicks (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  partner_id   uuid not null references public.partners(id),
  source_page  text,
  utm_source   text,
  utm_campaign text
);

alter table public.partner_clicks enable row level security;

create policy "anyone can record a click"
  on public.partner_clicks for insert
  with check (true);

grant insert on public.partner_clicks to anon, authenticated;

-- Партнёры-заглушки: реального партнёра ещё нет, is_placeholder = true.
-- Когда появится настоящий специалист и договор о комиссии — заменить
-- contact_url и выставить is_placeholder = false в Table Editor.
insert into public.partners (slug, name, description, contact_url, is_placeholder) values
  ('accountant', 'Бухгалтер-партнёр',
   'Разбор вопросов по налогам и декларации перед поездкой или во время работы.',
   'mailto:hello@balticworkers-check.example', true),
  ('id06-specialist', 'Специалист по A1 и ID06',
   'Поможет понять, какие документы нужны для легальной работы на объекте.',
   'mailto:hello@balticworkers-check.example', true);

-- Email-уведомления о новых вакансиях. Без аккаунтов и паролей — email +
-- фильтр (как в поиске), двойное подтверждение по GDPR, отписка в один клик
-- по токену. anon может только вставить строку (форма подписки); читать,
-- подтверждать и отписывать может только service_role через route handlers —
-- email других подписчиков никому не должен быть виден на чтение.

create table public.job_alerts (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  email             text not null,
  query             text not null default '',  -- профессия, как в поиске (q=)
  country           text not null default '',  -- 'SE' | 'NO' | '' (любая)
  confirm_token     text not null unique,
  confirmed_at      timestamptz,
  unsubscribe_token text not null unique,
  unsubscribed_at   timestamptz,
  last_notified_at  timestamptz,
  unique (email, query, country)
);

alter table public.job_alerts enable row level security;

-- Публичная форма может только создать подписку. Дубликат (тот же email +
-- фильтр) упадёт на unique-констрейнт — это ловится в коде по коду ошибки
-- 23505, отдельный SELECT для проверки "уже подписан" анону не нужен.
create policy "anyone can subscribe"
  on public.job_alerts for insert
  with check (true);

grant insert on public.job_alerts to anon, authenticated;

-- Подтверждение/отписка/подбор совпадений — только service_role по токену
-- в route handlers (/api/alerts/confirm, /api/alerts/unsubscribe, /api/notify).
grant select, update on public.job_alerts to service_role;


-- ---------------------------------------------------------------------------
-- Вакансии, снятые по просьбе работодателя (миграция 014).
--
-- Держит обещание со страниц /employers/sv и /employers/nb: «не хотите
-- показываться — уберём вакансию». Без таблицы импортёр возвращал бы снятую
-- вакансию при следующем прогоне.
--
-- Ключ (source_name, external_id) — те же колонки, что и в vacancies.
-- Два уровня исключения: по объявлению и по работодателю. Второй нужен
-- потому, что id объявления в источнике не переиспользуется (у JobTech
-- глобальный возрастающий счётчик, у NAV uuid), и повторная публикация той
-- же вакансии получает НОВЫЙ id, мимо исключения по id.
-- ---------------------------------------------------------------------------
create table public.excluded_vacancies (
  id            uuid primary key default gen_random_uuid(),

  source_name   text not null,        -- как в vacancies.source_name
  external_id   text,                 -- одно объявление; null = не по объявлению
  employer_name text,                 -- все объявления работодателя; null = не по нему

  reason        text,
  requested_by  text,                 -- email обратившегося, для аудита
  created_at    timestamptz not null default now(),

  -- Пустая запись исключила бы всё подряд из источника.
  constraint excluded_vacancies_target_ck
    check (external_id is not null or employer_name is not null)
);

create unique index excluded_vacancies_ad_uq
  on public.excluded_vacancies (source_name, external_id)
  where external_id is not null;

-- lower(btrim(...)), не просто lower(...): сравнение в коде
-- (src/lib/importers/exclusions.ts) делает trim().toLowerCase(), и без
-- btrim здесь пара строк "Bodens kommun" / "Bodens kommun " (хвостовой
-- пробел при вставке в Studio) не считалась бы дублем на уровне БД, хотя
-- в рантайме матчится как один и тот же работодатель.
create unique index excluded_vacancies_employer_uq
  on public.excluded_vacancies (source_name, lower(btrim(employer_name)))
  where employer_name is not null;

alter table public.excluded_vacancies enable row level security;

-- Не публичные данные (в reason/requested_by переписка с работодателем).
-- service_role обходит RLS, но НЕ обычный GRANT — без него Data API таблицу
-- не увидит.
grant select, insert, update, delete on public.excluded_vacancies to service_role;
