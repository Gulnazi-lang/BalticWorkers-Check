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
