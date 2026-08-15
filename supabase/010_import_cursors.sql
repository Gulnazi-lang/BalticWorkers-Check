-- Курсор импортёров между запусками cron. Нужен NAV: фид pam-stilling-feed —
-- непрерывный журнал событий с историей примерно с 2019 года, без курсора
-- каждый запуск заново бы прыгал в разумное окно "несколько дней назад" и
-- частично пересканировал недавнее. JobTech в курсоре не нуждается — это
-- поиск по ключу, а не журнал, состояния между запусками не хранит.

create table public.import_cursors (
  source      text primary key,   -- 'nav'
  cursor_time timestamptz not null,
  updated_at  timestamptz not null default now()
);

create trigger import_cursors_updated_at
  before update on public.import_cursors
  for each row execute function set_updated_at();

-- Не публичные данные, читает/пишет только сервис (импортёры).
alter table public.import_cursors enable row level security;
grant select, insert, update, delete on public.import_cursors to service_role;
