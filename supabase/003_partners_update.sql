-- Патч поверх 002_partners.sql в его исходном (вчерашнем) виде: добавляет
-- is_placeholder и остальное, что нужно текущему коду. Написан безопасно
-- на случай частичного применения — можно запускать один раз, ошибок не
-- должно быть независимо от того, что именно уже успело выполниться.

-- active -> is_active, если колонка ещё называется по-старому.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'partners' and column_name = 'active'
  ) then
    alter table public.partners rename column active to is_active;
  end if;
end $$;

alter table public.partners
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists is_placeholder boolean not null default true;

alter table public.partner_clicks
  add column if not exists utm_source text,
  add column if not exists utm_campaign text;

drop policy if exists "public reads active partners" on public.partners;
create policy "public reads active partners"
  on public.partners for select
  using (is_active = true);

drop trigger if exists partners_updated_at on public.partners;
create trigger partners_updated_at
  before update on public.partners
  for each row execute function set_updated_at();

-- На случай, если исходные строки ещё не вставлены — добавит их;
-- если уже есть (slug уникален), просто ничего не сделает.
insert into public.partners (slug, name, description, contact_url, is_placeholder) values
  ('accountant', 'Бухгалтер-партнёр',
   'Разбор вопросов по налогам и декларации перед поездкой или во время работы.',
   'mailto:hello@nordicwork-check.example', true),
  ('id06-specialist', 'Специалист по A1 и ID06',
   'Поможет понять, какие документы нужны для легальной работы на объекте.',
   'mailto:hello@nordicwork-check.example', true)
on conflict (slug) do nothing;
