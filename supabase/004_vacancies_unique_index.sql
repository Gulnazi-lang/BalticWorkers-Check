-- Частичный уникальный индекс (with where external_id is not null) не
-- подходит как arbiter для "on conflict (source_name, external_id)" без
-- WHERE прямо в запросе — а через Supabase JS клиент это не передать.
-- Заменяем на обычный индекс: NULL уже сам по себе не конфликтует с NULL
-- в уникальных индексах Postgres, так что практика дедупликации не меняется.

drop index if exists public.vacancies_source_uq;

create unique index vacancies_source_uq
  on public.vacancies (source_name, external_id);
