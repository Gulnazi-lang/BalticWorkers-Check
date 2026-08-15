-- Список профессий для поиска строится из фактических occupation_isco
-- опубликованных вакансий — пустых пунктов быть не может по определению,
-- каждый гарантированно что-то находит. Подписи — из справочника по
-- текущей локали, не из названия источника (то остаётся на карточке).
--
-- Заполнено для кодов, реально встречающихся в базе на 15.08.2026 (22 шт).
-- Синонимы для свободного ввода ("доярка" -> ISCO 6121) — отдельная
-- задача, этой миграцией не покрыта.

create table public.occupation_labels (
  isco_code text not null,
  locale    text not null,
  label     text not null,
  primary key (isco_code, locale)
);

alter table public.occupation_labels enable row level security;

create policy "public reads occupation labels"
  on public.occupation_labels for select
  using (true);

grant select on public.occupation_labels to anon, authenticated;
grant select, insert, update, delete on public.occupation_labels to service_role;

-- Счётчик вакансий по коду — только опубликованные, RLS таблицы vacancies
-- действует и через view (не security definer), лишнего не покажет.
create view public.occupation_counts as
select occupation_isco, count(*) as vacancy_count
from public.vacancies
where published = true and occupation_isco is not null
group by occupation_isco;

grant select on public.occupation_counts to anon, authenticated;

insert into public.occupation_labels (isco_code, locale, label) values
  ('1530', 'lv', 'Nodaļas vadītājs (sociālais dienests)'),
  ('1530', 'ru', 'Руководитель подразделения (соцслужба)'),
  ('1530', 'en', 'Unit manager (social services)'),
  ('1530', 'lt', 'Padalinio vadovas (socialinės paslaugos)'),
  ('1530', 'et', 'Üksuse juht (sotsiaalteenused)'),

  ('4322', 'lv', 'Noliktavas darbinieks'),
  ('4322', 'ru', 'Складской рабочий'),
  ('4322', 'en', 'Warehouse worker'),
  ('4322', 'lt', 'Sandėlio darbuotojas'),
  ('4322', 'et', 'Laotöötaja'),

  ('5311', 'lv', 'Auklīte bērnudārzā'),
  ('5311', 'ru', 'Няня в детском саду'),
  ('5311', 'en', 'Kindergarten childcare worker'),
  ('5311', 'lt', 'Auklė darželyje'),
  ('5311', 'et', 'Lasteaia lapsehoidja'),

  ('5321', 'lv', 'Mājas aprūpes darbinieks'),
  ('5321', 'ru', 'Соцработник на дому'),
  ('5321', 'en', 'Home care worker'),
  ('5321', 'lt', 'Namų priežiūros darbuotojas'),
  ('5321', 'et', 'Koduhooldustöötaja'),

  ('5330', 'lv', 'Aprūpes palīgs'),
  ('5330', 'ru', 'Помощник по уходу'),
  ('5330', 'en', 'Care assistant'),
  ('5330', 'lt', 'Slaugos padėjėjas'),
  ('5330', 'et', 'Hooldusabiline'),

  ('5343', 'lv', 'Personīgais asistents / aprūpētājs'),
  ('5343', 'ru', 'Личный ассистент / сиделка'),
  ('5343', 'en', 'Personal assistant / carer'),
  ('5343', 'lt', 'Asmeninis asistentas / slaugas'),
  ('5343', 'et', 'Isiklik abistaja / hooldaja'),

  ('7111', 'lv', 'Būvstrādnieks (karkasa darbi)'),
  ('7111', 'ru', 'Строитель (каркасные работы)'),
  ('7111', 'en', 'Construction worker (framing)'),
  ('7111', 'lt', 'Statybininkas (karkasas)'),
  ('7111', 'et', 'Ehitustööline (karkass)'),

  ('7119', 'lv', 'Būvstrādnieks'),
  ('7119', 'ru', 'Строительный рабочий'),
  ('7119', 'en', 'Construction worker'),
  ('7119', 'lt', 'Statybininkas'),
  ('7119', 'et', 'Ehitustööline'),

  ('7124', 'lv', 'Siltumizolācijas montieris'),
  ('7124', 'ru', 'Монтажник теплоизоляции'),
  ('7124', 'en', 'Insulation installer'),
  ('7124', 'lt', 'Šiltinimo montuotojas'),
  ('7124', 'et', 'Soojustaja'),

  ('7125', 'lv', 'Stiklinieks'),
  ('7125', 'ru', 'Стекольщик'),
  ('7125', 'en', 'Glazier'),
  ('7125', 'lt', 'Stiklius'),
  ('7125', 'et', 'Klaasija'),

  ('7131', 'lv', 'Krāsotājs'),
  ('7131', 'ru', 'Маляр'),
  ('7131', 'en', 'Painter'),
  ('7131', 'lt', 'Dažytojas'),
  ('7131', 'et', 'Maaler'),

  ('7212', 'lv', 'Metinātājs'),
  ('7212', 'ru', 'Сварщик'),
  ('7212', 'en', 'Welder'),
  ('7212', 'lt', 'Suvirintojas'),
  ('7212', 'et', 'Keevitaja'),

  ('7215', 'lv', 'Takelāžists'),
  ('7215', 'ru', 'Такелажник'),
  ('7215', 'en', 'Rigger'),
  ('7215', 'lt', 'Takelažininkas'),
  ('7215', 'et', 'Takeldaja'),

  ('7233', 'lv', 'Lauksaimniecības/rūpniecības tehnikas mehāniķis'),
  ('7233', 'ru', 'Механик сельхоз- и промтехники'),
  ('7233', 'en', 'Agricultural/industrial machinery mechanic'),
  ('7233', 'lt', 'Žemės ūkio / pramonės technikos mechanikas'),
  ('7233', 'et', 'Põllumajandus-/tööstustehnika mehaanik'),

  ('7411', 'lv', 'Elektriķis (būvniecība)'),
  ('7411', 'ru', 'Электрик (строительство)'),
  ('7411', 'en', 'Electrician (construction)'),
  ('7411', 'lt', 'Elektrikas (statyba)'),
  ('7411', 'et', 'Elektrik (ehitus)'),

  ('7412', 'lv', 'Elektromehāniķis'),
  ('7412', 'ru', 'Электромеханик'),
  ('7412', 'en', 'Electrical fitter'),
  ('7412', 'lt', 'Elektromechanikas'),
  ('7412', 'et', 'Elektrimehaanik'),

  ('8199', 'lv', 'Ražošanas līnijas operators'),
  ('8199', 'ru', 'Оператор производственной линии'),
  ('8199', 'en', 'Production line operator'),
  ('8199', 'lt', 'Gamybos linijos operatorius'),
  ('8199', 'et', 'Tootmisliini operaator'),

  ('8213', 'lv', 'Izstrādājumu montētājs'),
  ('8213', 'ru', 'Сборщик изделий'),
  ('8213', 'en', 'Product assembler'),
  ('8213', 'lt', 'Gaminių montuotojas'),
  ('8213', 'et', 'Toodete koostaja'),

  ('8332', 'lv', 'Kravas automašīnas vadītājs'),
  ('8332', 'ru', 'Водитель грузовика'),
  ('8332', 'en', 'Truck driver'),
  ('8332', 'lt', 'Sunkvežimio vairuotojas'),
  ('8332', 'et', 'Veokijuht'),

  ('9111', 'lv', 'Apkopējs'),
  ('9111', 'ru', 'Уборщик'),
  ('9111', 'en', 'Cleaner'),
  ('9111', 'lt', 'Valytojas'),
  ('9111', 'et', 'Koristaja'),

  ('9119', 'lv', 'Auklīte'),
  ('9119', 'ru', 'Няня'),
  ('9119', 'en', 'Nanny'),
  ('9119', 'lt', 'Auklė'),
  ('9119', 'et', 'Lapsehoidja'),

  ('9310', 'lv', 'Būvstrādnieks (palīgstrādnieks)'),
  ('9310', 'ru', 'Строительный рабочий (подсобный)'),
  ('9310', 'en', 'Construction labourer'),
  ('9310', 'lt', 'Statybos pagalbinis darbuotojas'),
  ('9310', 'et', 'Ehituse abitööline');

-- Подписки на вакансии: переход с ilike-по-сырому-title (не работало для
-- нероманских языков поиска — та же проблема, что решает эта миграция) на
-- точное совпадение по occupation_isco. query оставляем как есть — старые
-- подписки (до этого перехода) на неё ещё опираются в /api/notify, новые
-- пишут occupation_isco и оставляют query пустой.
alter table public.job_alerts add column occupation_isco text;

-- Имя автосгенерированного constraint'а unique(email, query, country) не
-- фиксировали при создании таблицы — находим и дропаем динамически, а не
-- гадаем название.
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.job_alerts'::regclass and contype = 'u'
  loop
    execute format('alter table public.job_alerts drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.job_alerts
  add constraint job_alerts_email_occupation_country_key
  unique (email, occupation_isco, country);
