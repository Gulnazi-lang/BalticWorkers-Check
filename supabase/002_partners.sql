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
   'mailto:hello@nordicwork-check.example', true),
  ('id06-specialist', 'Специалист по A1 и ID06',
   'Поможет понять, какие документы нужны для легальной работы на объекте.',
   'mailto:hello@nordicwork-check.example', true);
