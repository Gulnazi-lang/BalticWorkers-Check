-- Уборка и кухня в норвежском импорте (24.08.2026).
--
-- Обе отрасли охвачены allmenngjøring — общеобязательным тарифом, поэтому
-- законный минимум показывается на карточке даже когда работодатель молчит
-- об условиях. Молчат почти все: ни одно из 210 проверенных объявлений не
-- упоминает allmenngjøring или minstelønn.
--
-- Уборка: forskrift 2024-10-21-2545 с изменением 2025-05-28-957.
-- Общепит/гостиницы/кейтеринг: forskrift 2024-10-21-2543.
-- Обе ставки действуют с 15.06.2025.
--
-- Уход (helsefagarbeider и смежные) сознательно НЕ добавлен: allmenngjøring
-- на здравоохранение не распространяется, а из 71 объявления с заполненным
-- полем Arbeidsspråk английский не допустило ни одно.

insert into public.collective_agreements
  (code, country, sector, legal_force, source_url, version_label, valid_from, valid_to)
values
  ('NO-RENHOLD-2025', 'NO', 'cleaning', 'universally_binding',
   'https://lovdata.no/dokument/SF/forskrift/2024-10-21-2545',
   'Cleaning minimum rates effective 2025-06-15', '2025-06-15', null),
  ('NO-OSC-2025', 'NO', 'hospitality', 'universally_binding',
   'https://lovdata.no/dokument/SF/forskrift/2024-10-21-2543',
   'Accommodation, catering and food service minimum rates effective 2025-06-15', '2025-06-15', null)
on conflict (code, country, version_label) do nothing;

insert into public.collective_agreement_rates
  (agreement_id, category, min_amount, currency, wage_type, note, valid_from, valid_to, source_url)
select a.id, v.category, v.amount, 'NOK', 'gross_hour', v.note,
       '2025-06-15', null, a.source_url
from public.collective_agreements a
cross join (values
  ('worker_18_and_over', 236.54::numeric, 'Cleaner aged 18 or over. Night work between 21:00 and 06:00 carries an additional supplement of at least NOK 29 per hour.'),
  ('worker_under_18', 185.55::numeric, 'Cleaner under 18 years of age')
) as v(category, amount, note)
where a.code = 'NO-RENHOLD-2025' and a.country = 'NO'
  and not exists (
    select 1 from public.collective_agreement_rates r
    where r.agreement_id = a.id and r.category = v.category and r.valid_from = '2025-06-15'
  );

insert into public.collective_agreement_rates
  (agreement_id, category, min_amount, currency, wage_type, note, valid_from, valid_to, source_url)
select a.id, v.category, v.amount, 'NOK', 'gross_hour', v.note,
       '2025-06-15', null, a.source_url
from public.collective_agreements a
cross join (values
  ('worker_20_and_over', 204.79::numeric, 'Worker over 20, or 18 and over with more than four months of industry practice'),
  ('worker_age_18', 166.34::numeric, 'Worker aged 18'),
  ('worker_age_17', 152.08::numeric, 'Worker aged 17'),
  ('worker_under_17', 142.58::numeric, 'Worker under 17 years of age')
) as v(category, amount, note)
where a.code = 'NO-OSC-2025' and a.country = 'NO'
  and not exists (
    select 1 from public.collective_agreement_rates r
    where r.agreement_id = a.id and r.category = v.category and r.valid_from = '2025-06-15'
  );

insert into public.occupation_labels (isco_code, locale, label) values
  ('NO-9112', 'lv', 'Apkopējs / apkopēja'),
  ('NO-9112', 'ru', 'Уборщик / уборщица'),
  ('NO-9112', 'en', 'Cleaner'),
  ('NO-9112', 'lt', 'Valytojas'),
  ('NO-9112', 'et', 'Koristaja'),
  ('NO-9111', 'lv', 'Apkopējs / apkopēja'),
  ('NO-9111', 'ru', 'Уборщик / уборщица'),
  ('NO-9111', 'en', 'Cleaner'),
  ('NO-9111', 'lt', 'Valytojas'),
  ('NO-9111', 'et', 'Koristaja'),
  ('NO-5151', 'lv', 'Apkopējs / apkopēja'),
  ('NO-5151', 'ru', 'Уборщик / уборщица'),
  ('NO-5151', 'en', 'Cleaner'),
  ('NO-5151', 'lt', 'Valytojas'),
  ('NO-5151', 'et', 'Koristaja'),
  ('NO-5120', 'lv', 'Pavārs'),
  ('NO-5120', 'ru', 'Повар'),
  ('NO-5120', 'en', 'Cook'),
  ('NO-5120', 'lt', 'Virėjas'),
  ('NO-5120', 'et', 'Kokk'),
  ('NO-9412', 'lv', 'Virtuves palīgs'),
  ('NO-9412', 'ru', 'Помощник повара'),
  ('NO-9412', 'en', 'Kitchen assistant'),
  ('NO-9412', 'lt', 'Virtuvės pagalbininkas'),
  ('NO-9412', 'et', 'Köögiabiline'),
  ('NO-5246', 'lv', 'Virtuves palīgs'),
  ('NO-5246', 'ru', 'Помощник повара'),
  ('NO-5246', 'en', 'Kitchen assistant'),
  ('NO-5246', 'lt', 'Virtuvės pagalbininkas'),
  ('NO-5246', 'et', 'Köögiabiline')
on conflict (isco_code, locale) do update set label = excluded.label;
