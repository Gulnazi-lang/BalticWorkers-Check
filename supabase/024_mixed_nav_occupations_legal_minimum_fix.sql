-- STYRK08 7212 (sveisere) and 9312/9313 (hjelpearbeidere) do not identify
-- the employer's industry reliably. They can describe workshops, industrial
-- production, shipyards or general support work, not only construction.
--
-- Keep the vacancies, but remove the unverified construction badge from rows
-- created by the NAV importer. Never overwrite a manually confirmed rate.
update public.vacancies
set
  legal_minimum_status = 'unknown',
  legal_minimum_sector = null,
  updated_at = now()
where source_name = 'NAV'
  and occupation_isco in ('NO-7212', 'NO-9312', 'NO-9313')
  and legal_minimum_status = 'possible'
  and legal_minimum_sector = 'construction';
