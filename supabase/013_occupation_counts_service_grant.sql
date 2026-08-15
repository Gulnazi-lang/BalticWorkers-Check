-- 012 выдал grant на occupation_counts только anon/authenticated — сайт
-- читает view именно этим ключом, так что вживую ничего не сломано. Но
-- та же ловушка уже случалась с vacancies (см. schema.sql): service_role
-- обходит RLS, но не обычный GRANT. Догоняем для консистентности — вдруг
-- позже понадобится читать view из серверного кода на service_role.
grant select on public.occupation_counts to service_role;
