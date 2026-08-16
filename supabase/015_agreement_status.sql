-- Различает "у вакансии есть коллективный договор, но неясно какой" от
-- "договор назван и привязан к конкретной ставке" — 16.08.2026, вслед за
-- проверкой реальных объявлений: из 70 SE-объявлений, упоминающих
-- kollektivavtal, только 13 (18.6%) называют договор конкретно, 57 —
-- общей формулировкой без названия ("Lön enligt kollektivavtal"). Раньше
-- обе формы попадали в одно и то же collective_agreement (text) и
-- рендерились на карточке одинаково — карточка не показывала разницу
-- между «переписали фразу из объявления» и «знаем точно, какой договор
-- и какая по нему ставка».
--
-- Тот же паттерн, что у housing_status/travel_status: обычный text,
-- не отдельный enum-тип, валидация значений на уровне приложения
-- (toAgreementStatus() в src/lib/vacancies.ts).
--   'named'          — договор назван конкретно, можно показывать ставку.
--   'exists_unnamed' — договор есть, название не указано. Реальная
--                       информация (минимум чем-то гарантирован), но НЕ
--                       основание показывать конкретную цифру.
--   'unknown'         — по умолчанию, включая все уже импортированные
--                        вакансии до этой миграции.
--
-- Порядок ниже уже безопасен сам по себе: колонка с DEFAULT добавляется
-- ДО двух CHECK, а Postgres 11+ заполняет константный DEFAULT для всех
-- существующих строк как метаданные, без переписывания таблицы — отдельный
-- backfill не нужен. Дополнительно проверено перед применением 16.08.2026
-- напрямую в БД: 0 строк на тот момент имели collective_agreement или
-- collective_agreement_id не null, так что CHECK ниже не мог упасть на
-- существующих данных даже теоретически.
--
-- BEGIN/COMMIT — не потому что этому конкретному файлу они были нужны
-- (см. выше), а как стандарт для любой будущей миграции: Studio отправляет
-- вставленный текст одним query string, и без явного BEGIN весь файл и
-- так выполняется как одна неявная транзакция (простой query protocol
-- Postgres) — но полагаться на неявное поведение хуже, чем сказать явно,
-- и явная обёртка не зависит от того, как именно вставленный текст будет
-- исполнен в будущем (например, если кто-то скопирует один блок
-- statement'ов из середины файла в отдельный запрос).
--
-- IF NOT EXISTS / DROP CONSTRAINT IF EXISTS — миграцию можно безопасно
-- запустить повторно (например, по ошибке дважды вставили файл в SQL
-- Editor): без этого второй прогон падал бы на первом же ADD COLUMN
-- ("column already exists"), а с BEGIN/COMMIT ещё и откатывал бы весь
-- блок целиком — рабочий результат, но потерянное время на ровном месте.
begin;

alter table public.vacancies
  add column if not exists agreement_status text not null default 'unknown';

-- Правило, которое должно пережить будущие правки тарифной части (решение
-- зафиксировано в CLAUDE.md): расчёт или показ конкретной тарифной ставки
-- работает ТОЛЬКО при agreement_status = 'named'. Здесь это не просто
-- комментарий — CHECK-констрейнты делают нарушение структурно невозможным:
-- ни collective_agreement (текст), ни collective_agreement_id (FK на
-- реальную ставку) не могут быть заполнены, если agreement_status не
-- 'named' — даже будущий баг в коде импортёра или редакционная правка
-- через Studio мимо этого правила не пройдут на уровне базы.
alter table public.vacancies
  drop constraint if exists vacancies_agreement_name_ck;
alter table public.vacancies
  add constraint vacancies_agreement_name_ck
    check (collective_agreement is null or agreement_status = 'named');

alter table public.vacancies
  drop constraint if exists vacancies_agreement_rate_ck;
alter table public.vacancies
  add constraint vacancies_agreement_rate_ck
    check (collective_agreement_id is null or agreement_status = 'named');

commit;
