-- Бэкфилл occupation_term для строк, застрявших с null из-за того, что
-- реальный заголовок использует бытовой синоним, а не поисковый термин
-- (23.09.2026, найдено случайным взглядом на /ru#jobs: "Extra Personal
-- Lokalvårdare till ISS i Lycksele" показывала сырой шведский заголовок).
--
-- Не ошибка импортёра как такового: эти строки пришли по оси работодателя
-- (fetchByEmployer в jobtech.ts) — вакансия найдена по имени подрядчика,
-- term тогда берётся из occupationTermFromTitle(заголовок), и подстрочное
-- совпадение подвело на двух синонимах: "lokalvårdare" (=städare) и
-- английское "helpers" (=hjälparbetare) в объявлениях мегапроектов под
-- Буденом/Лулео. occupations.ts теперь знает оба алиаса — эта миграция
-- только подтягивает УЖЕ существующие строки, чтобы значение в базе не
-- расходилось с тем, что теперь показывает карточка (рендер и без бэкфилла
-- работал бы верно за счёт occupationLabelFromTitle-фолбэка, но оставлять
-- occupation_term = null, зная term, — не соответствует остальному проекту).
--
-- Аудит на 23.09.2026: из 19 непереведённых карточек только эти 3 — синоним
-- известной нам профессии. Остальные 16 (Blockchef, Quality Manager,
-- Arbetsledare, Kundmottagare, Brevbärare, Fastighetstekniker и т.п.) —
-- управленческие/непрофильные роли вне текущего набора профессий, их
-- occupation_term намеренно остаётся null (см. комментарий у
-- ImportedVacancy.occupation_term в jobtech.ts — так и задумано с самого
-- начала оси по работодателю).

update public.vacancies
set occupation_term = 'städare'
where source_name = 'Arbetsförmedlingen'
  and occupation_term is null
  and title ilike '%lokalvårdare%';

update public.vacancies
set occupation_term = 'hjälparbetare'
where source_name = 'Arbetsförmedlingen'
  and occupation_term is null
  and (title ilike '%helpers%' or title ilike '% helper %' or title ilike '%helper till%');
