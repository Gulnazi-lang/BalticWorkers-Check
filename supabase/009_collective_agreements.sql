-- Тарифные ставки по коллективным договорам — 15.08.2026.
--
-- Ключевое решение: тариф не зарплата вакансии. wage_amount остаётся
-- тем, что реально написал работодатель (или null, если не написал).
-- Тариф — отдельная сущность, показывается отдельным блоком в карточке.
-- Смешать их в одном поле значит утверждать то, чего работодатель не
-- обещал, — прямой удар по бейджу проверки.
--
-- Швеция и Норвегия юридически разные: в Норвегии allmenngjøring делает
-- тариф в охваченных отраслях обязательным для любого работодателя
-- (universally_binding). В Швеции договор связывает только работодателя,
-- который в него вступил (members_only) — незаконного нарушения может и
-- не быть, если работодатель просто не состоит в объединении.

create type agreement_legal_force as enum (
  'universally_binding',  -- NO: allmenngjort, обязателен для всех в отрасли
  'members_only'          -- SE: связывает только членов / подписавших hängavtal
);

-- Страны — справочником, а не хардкодом в типах. Добавление новой страны
-- (например Германии, обсуждали при ребрендинге) станет строкой здесь,
-- а не рефакторингом src/types/vacancy.ts.
create table public.countries (
  code       text primary key,   -- 'SE' | 'NO'
  name_key   text not null,      -- ключ в common.country словаря (см. src/i18n/messages)
  is_enabled boolean not null default true
);

grant select on public.countries to anon, authenticated;
grant select, insert, update, delete on public.countries to service_role;

insert into public.countries (code, name_key) values
  ('SE', 'SE'),
  ('NO', 'NO');

alter table public.vacancies
  add constraint vacancies_country_fkey foreign key (country) references public.countries(code);

create table public.collective_agreements (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,               -- 'PAN 25', 'Byggavtalet' и т.п.
  country       text not null references public.countries(code),
  sector        text not null,               -- 'personal_assistance', 'construction'
  legal_force   agreement_legal_force not null,
  source_url    text not null,               -- официальный документ, не агрегатор
  version_label text not null,               -- 'PAN 25 (2025-04-01–2027-03-31)'
  valid_from    date not null,
  valid_to      date,                        -- null = бессрочно/автопродление
  updated_at    timestamptz not null default now()
);

create unique index collective_agreements_uq
  on public.collective_agreements (code, country, version_label);

create trigger collective_agreements_updated_at
  before update on public.collective_agreements
  for each row execute function set_updated_at();

alter table public.collective_agreements enable row level security;

create policy "public reads collective agreements"
  on public.collective_agreements for select
  using (true);

grant select on public.collective_agreements to anon, authenticated;
grant select, insert, update, delete on public.collective_agreements to service_role;

-- Ставки внутри договора — отдельная таблица, потому что один договор
-- может содержать несколько категорий/ступеней (в PAN 25 их нет, но в
-- Byggavtalet будут yrkesarbetare/grundlön и т.п.).
create table public.collective_agreement_rates (
  id            uuid primary key default gen_random_uuid(),
  agreement_id  uuid not null references public.collective_agreements(id) on delete cascade,
  category      text not null,               -- 'personlig_assistent', 'yrkesarbetare'
  min_amount    numeric not null,
  currency      text not null,               -- 'SEK' | 'NOK'
  wage_type     text not null,               -- 'gross_hour' | 'gross_month'
  housing_rule  text,
  travel_rule   text,
  note          text
);

alter table public.collective_agreement_rates enable row level security;

create policy "public reads collective agreement rates"
  on public.collective_agreement_rates for select
  using (true);

grant select on public.collective_agreement_rates to anon, authenticated;
grant select, insert, update, delete on public.collective_agreement_rates to service_role;

-- Связь с вакансией. collective_agreement (текстовое поле) НЕ удаляем —
-- сначала заполнить collective_agreement_id вручную/при импорте,
-- убедиться, что сматчилось, дропать текстовое поле отдельной миграцией
-- позже, если вообще понадобится.
alter table public.vacancies
  add column collective_agreement_id uuid references public.collective_agreements(id),
  add column employer_agreement_status text;  -- 'bound' | 'not_bound' | 'unknown' — актуально для SE

-- Первый договор: PAN 25 (personlig assistent) — самая массовая категория
-- в импорте (2017 вакансий на 14.08.2026 против 480 у второй по объёму
-- hemtjänst). Источник — официальный PDF SKR, не агрегатор.
insert into public.collective_agreements
  (code, country, sector, legal_force, source_url, version_label, valid_from, valid_to)
values (
  'PAN 25',
  'SE',
  'personal_assistance',
  'members_only',
  'https://skr.se/download/18.4d2a888c19913a970f8704ff/1757419263956/PAN%2025.pdf',
  'PAN 25 (SKR/Sobona ↔ Kommunal, 2025-04-01–2027-03-31)',
  '2025-04-01',
  '2027-03-31'
);

insert into public.collective_agreement_rates
  (agreement_id, category, min_amount, currency, wage_type, note)
select
  id,
  'personlig_assistent',
  143.26,
  'SEK',
  'gross_hour',
  'Действует для работников по § 1 c) (наняты работодателем — членом Sobona), 19+ лет. '
  || 'С 2027-01-01 ставка по договору повышается до 149,55 SEK/час — обновить вручную. '
  || 'Bilaga 1 § 2 п.6 к PAN 25.'
from public.collective_agreements
where code = 'PAN 25' and country = 'SE';
