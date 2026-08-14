-- Ребрендинг NordicWork Check -> BalticWorkers Check (14.08.2026).
-- 002/003_partners*.sql не правим задним числом — это исторический
-- журнал того, что реально было применено. Вместо этого обновляем
-- живые заглушки-контакты партнёров новым плейсхолдер-доменом.

update public.partners
set contact_url = 'mailto:hello@balticworkers-check.example'
where contact_url = 'mailto:hello@nordicwork-check.example';
