-- service_role обходит RLS, но не обходит обычные GRANT — проект создан с
-- выключенным "Automatically expose new tables", это, похоже, коснулось и
-- service_role, не только anon/authenticated. Импортёр (/api/import) пишет
-- в vacancies через service_role и падал с "permission denied for table
-- vacancies" без этого grant.

grant select, insert, update, delete on public.vacancies to service_role;
