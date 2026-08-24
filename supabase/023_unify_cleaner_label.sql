-- Уборка: одна подпись вместо двух (24.08.2026).
--
-- Список профессий на главной группируется по ПОДПИСИ (см. occupationOptions.ts),
-- поэтому шведский код 9111 с подписью «Apkopējs» и норвежские NO-9112/NO-9111/
-- NO-5151 с «Apkopējs / apkopēja» давали два пункта об одной профессии.
-- Приводим норвежские к формулировке, заведённой миграцией 012.

update public.occupation_labels l
set label = s.label
from public.occupation_labels s
where s.isco_code = '9111'
  and s.locale = l.locale
  and l.isco_code in ('NO-9112', 'NO-9111', 'NO-5151');
