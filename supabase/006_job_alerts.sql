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
