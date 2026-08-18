-- Журнал успешных прогонов импорта для независимого watchdog.
-- Применяется вручную в Supabase Studio ДО деплоя кода.
begin;

create table if not exists public.import_runs (
  source text primary key,
  succeeded_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.import_runs enable row level security;
grant select, insert, update, delete on public.import_runs to service_role;

commit;
