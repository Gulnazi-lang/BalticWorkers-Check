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

alter table public.vacancies
  add column agreement_status text not null default 'unknown';

-- Правило, которое должно пережить будущие правки тарифной части (решение
-- зафиксировано в CLAUDE.md): расчёт или показ конкретной тарифной ставки
-- работает ТОЛЬКО при agreement_status = 'named'. Здесь это не просто
-- комментарий — CHECK-констрейнты делают нарушение структурно невозможным:
-- ни collective_agreement (текст), ни collective_agreement_id (FK на
-- реальную ставку) не могут быть заполнены, если agreement_status не
-- 'named' — даже будущий баг в коде импортёра или редакционная правка
-- через Studio мимо этого правила не пройдут на уровне базы.
alter table public.vacancies
  add constraint vacancies_agreement_name_ck
    check (collective_agreement is null or agreement_status = 'named');

alter table public.vacancies
  add constraint vacancies_agreement_rate_ck
    check (collective_agreement_id is null or agreement_status = 'named');
