-- Диапазон приемлемой ставки для подписки на вакансии — всегда в EUR
-- (человек вводит в евро независимо от страны; сравнение с SEK/NOK самой
-- вакансии — отдельная задача подбора, не эта миграция). Оба поля
-- необязательные, как и раньше query/country (пустая строка = любая).
alter table public.job_alerts
  add column wage_min_eur numeric,
  add column wage_max_eur numeric;
