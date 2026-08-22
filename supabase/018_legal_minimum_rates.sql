-- A statutory minimum and a collective-agreement claim are different facts.
-- The FK is set only when industry and worker category are known reliably.
alter table public.collective_agreement_rates
  add column if not exists valid_from date,
  add column if not exists valid_to date,
  add column if not exists source_url text;

update public.collective_agreement_rates r
set valid_from = coalesce(r.valid_from, a.valid_from),
    valid_to = coalesce(r.valid_to, a.valid_to),
    source_url = coalesce(r.source_url, a.source_url)
from public.collective_agreements a
where a.id = r.agreement_id;

alter table public.collective_agreement_rates
  alter column valid_from set not null,
  alter column source_url set not null;

alter table public.vacancies
  add column if not exists legal_minimum_rate_id uuid,
  add column if not exists legal_minimum_status text not null default 'unknown',
  add column if not exists legal_minimum_sector text,
  add constraint vacancies_legal_minimum_rate_id_fkey
    foreign key (legal_minimum_rate_id)
    references public.collective_agreement_rates(id),
  add constraint vacancies_legal_minimum_status_check
    check (legal_minimum_status in ('unknown', 'possible', 'confirmed')),
  add constraint vacancies_legal_minimum_consistency_check
    check (
      (legal_minimum_status = 'confirmed' and legal_minimum_rate_id is not null)
      or (legal_minimum_status <> 'confirmed' and legal_minimum_rate_id is null)
    );

insert into public.collective_agreements
  (code, country, sector, legal_force, source_url, version_label, valid_from, valid_to)
values (
  'NO-BYGG-2025', 'NO', 'construction', 'universally_binding',
  'https://www.arbeidstilsynet.no/en/working-conditions/pay-and-minimum-rates-of-pay/minimum-wage/',
  'Construction minimum rates effective 2025-06-15', '2025-06-15', null
)
on conflict (code, country, version_label) do nothing;

insert into public.collective_agreement_rates
  (agreement_id, category, min_amount, currency, wage_type, note, valid_from, valid_to, source_url)
select a.id, v.category, v.amount, 'NOK', 'gross_hour', v.note,
       '2025-06-15', null, a.source_url
from public.collective_agreements a
cross join (values
  ('skilled_worker', 264.32::numeric, 'Skilled worker'),
  ('unskilled_without_experience', 239.61::numeric, 'Unskilled worker without industry experience'),
  ('unskilled_with_one_year_experience', 249.00::numeric, 'Unskilled worker with at least one year of industry experience'),
  ('worker_under_18', 162.44::numeric, 'Worker under 18 years of age')
) as v(category, amount, note)
where a.code = 'NO-BYGG-2025' and a.country = 'NO'
  and not exists (
    select 1 from public.collective_agreement_rates r
    where r.agreement_id = a.id and r.category = v.category and r.valid_from = '2025-06-15'
  );

