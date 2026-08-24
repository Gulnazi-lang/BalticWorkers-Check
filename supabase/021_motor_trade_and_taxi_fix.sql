-- Автосервис: allmenngjøring, о котором мы промолчали (24.08.2026).
--
-- Отрасль охвачена общеобязательным тарифом (forskrift for bilbransjen),
-- ставки действуют с 15.06.2026 и покрывают ремонт, обслуживание, покраску,
-- кузовные работы и склад внутри отрасли. Код STYRK08 7231 (Bilmekanikere)
-- получает sector 'motor_vehicle_repair'.
--
-- Одновременно из allowlist убран код 8322 (Bil-, drosje- og varebilførere):
-- он смешивает такси, развозку пиццы и курьеров. Allmenngjøring грузоперевозок
-- покрывает машины свыше 2,5 т, включая фургоны, но такси — никогда, поэтому
-- любой сектор на этом коде обещал бы законный минимум части людей, у которых
-- его нет. Уже импортированные строки с NO-8322 удаляются ниже.

insert into public.collective_agreements
  (code, country, sector, legal_force, source_url, version_label, valid_from, valid_to)
values (
  'NO-BIL-2026', 'NO', 'motor_vehicle_repair', 'universally_binding',
  'https://www.arbeidstilsynet.no/en/working-conditions/pay-and-minimum-rates-of-pay/minimum-wage/',
  'Motor vehicle trade minimum rates effective 2026-06-15', '2026-06-15', null
)
on conflict (code, country, version_label) do nothing;

insert into public.collective_agreement_rates
  (agreement_id, category, min_amount, currency, wage_type, note, valid_from, valid_to, source_url)
select a.id, v.category, v.amount, 'NOK', 'gross_hour', v.note,
       '2026-06-15', null, a.source_url
from public.collective_agreements a
cross join (values
  ('skilled_worker_newly_qualified', 223.50::numeric, 'Newly qualified skilled worker'),
  ('skilled_worker_with_one_year_experience', 237.00::numeric, 'Skilled worker with at least one year of experience'),
  ('unskilled_18_and_over', 208.00::numeric, 'Unskilled worker aged 18 or over'),
  ('unskilled_18_and_over_with_experience', 212.00::numeric, 'Unskilled worker aged 18 or over with at least one year of experience')
) as v(category, amount, note)
where a.code = 'NO-BIL-2026' and a.country = 'NO'
  and not exists (
    select 1 from public.collective_agreement_rates r
    where r.agreement_id = a.id and r.category = v.category and r.valid_from = '2026-06-15'
  );

-- Строки, попавшие в базу по ошибочному коду. Удаление, а не снятие с
-- публикации: условия NAV требуют убирать, а не прятать, и держать в базе
-- вакансию с неверным обещанием законной ставки нельзя.
delete from public.vacancies
where source_name = 'NAV' and occupation_isco = 'NO-8322';
