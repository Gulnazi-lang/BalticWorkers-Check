import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchJobTechVacancies, findRemovedJobTechIds, JOBTECH_SOURCE_NAME } from "@/lib/importers/jobtech";
import { isExcluded, loadExclusions, purgeExcluded } from "@/lib/importers/exclusions";
import { collectiveAgreementIdFor, resolveAgreementIds } from "@/lib/importers/resolveAgreements";
import { unpublishStaleVacancies } from "@/lib/importers/staleness";
import { notifyImportFailure } from "@/lib/importers/failureAlert";
import { createServiceClient } from "@/lib/supabase/service";

// Проверка на снятие (findRemovedJobTechIds) добавляет по одному запросу
// к JobTech на каждого КАНДИДАТА (published-строка, не найденная в свежем
// поисковом проходе — см. комментарий ниже), не на каждую published-строку
// вообще: в установившемся режиме это единицы, не сотни. Сразу после
// сужения OCCUPATIONS кандидатов будет много (вся отвалившаяся care-пачка)
// — разовый всплеск, не постоянный режим. На Hobby-плане Vercel реальный
// лимит выполнения функции может быть жёстче заявленного здесь maxDuration
// — увидеть на живом прогоне, не предполагать.
export const maxDuration = 60;

// GET, а не POST: чтобы без лишней настройки триггерился Vercel Cron
// (он умеет вызывать только GET). Защита не в методе, а в секрете.
export async function GET(request: NextRequest) {
  // IMPORT_SECRET оставляет безопасный ручной запуск. Vercel Cron сам присылает
  // CRON_SECRET в Authorization, поэтому оба секрета принимаются только здесь.
  const secrets = [process.env.IMPORT_SECRET, process.env.CRON_SECRET].filter(
    (secret): secret is string => Boolean(secret)
  );
  if (secrets.length === 0) {
    return NextResponse.json(
      { error: "IMPORT_SECRET или CRON_SECRET не настроен" },
      { status: 500 }
    );
  }
  const authorization = request.headers.get("authorization");
  if (!secrets.some((secret) => authorization === `Bearer ${secret}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // fetchJobTechVacancies() уже возвращает ОДИН объединённый массив —
    // термины и работодатели (см. CONTRACTOR_EMPLOYERS в jobtech.ts) слиты
    // внутри через общий Set до return. Фильтр исключений ниже применяется
    // к этому объединённому результату целиком, значит действует на обе
    // оси одинаково: вакансия от исключённого работодателя не может
    // "проскочить" через employer-проход в обход exclusion-листа — к
    // моменту фильтрации уже нет разницы, откуда именно она пришла.
    const vacancies = await fetchJobTechVacancies();
    const supabase = createServiceClient();

    // Вакансии, снятые по просьбе работодателя (миграция 014). Две вещи
    // сразу: отсеять их из свежей выдачи и убрать то, что успело попасть в
    // базу ДО обращения — иначе запись в exclusion-лист действовала бы
    // только на будущие объявления, а висящее на сайте так и осталось бы.
    const exclusions = await loadExclusions(supabase, JOBTECH_SOURCE_NAME);
    const purged = await purgeExcluded(supabase, JOBTECH_SOURCE_NAME, exclusions);
    const allowed = vacancies.filter((v) => isExcluded(exclusions, v) === false);

    let imported = 0;
    if (allowed.length > 0) {
      // Привязка вакансии к договору по occupation_term — детерминированная,
      // не требует решения человека (в отличие от employer_agreement_status,
      // которое остаётся редакционным полем и импортёром не трогается).
      const agreementIdByCode = await resolveAgreementIds(
        supabase,
        "SE",
        allowed.map((v) => v.occupation_term)
      );
      const vacanciesWithAgreement = allowed.map((v) => {
        const collectiveAgreementId = collectiveAgreementIdFor(agreementIdByCode, v.occupation_term);
        return {
          ...v,
          collective_agreement_id: collectiveAgreementId,
          // agreement_status идёт в паре с collective_agreement_id: CHECK
          // vacancies_agreement_rate_ck (015_agreement_status.sql) требует
          // agreement_status = 'named', когда FK на ставку задан — без этой
          // строки upsert падал бы для любой вакансии с найденным договором.
          // Без совпадения поле не трогаем — не затираем возможную ручную
          // правку редакции повторным импортом (upsert обновляет только
          // перечисленные здесь колонки).
          ...(collectiveAgreementId ? { agreement_status: "named" } : {}),
        };
      });

      const { data, error } = await supabase
        .from("vacancies")
        .upsert(vacanciesWithAgreement, { onConflict: "source_name,external_id" })
        .select("id");

      if (error) {
        console.error(`[import:jobtech] vacancies upsert failed: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      imported = data?.length ?? 0;
    }

    // Снятие вакансий, пропавших у источника (не по просьбе работодателя —
    // это purgeExcluded выше — а сами по себе: employer снял объявление,
    // JobTech больше его не отдаёт). У JobTech нет событийного фида статусов
    // как у NAV, поэтому единственный надёжный сигнал — прямой запрос по
    // каждому id (findRemovedJobTechIds в jobtech.ts — 404 или removed:true).
    // Без этого шага снятая вакансия висела бы на сайте бессрочно.
    //
    // Проверяем НЕ все published-строки источника, а только кандидатов —
    // те, что не встретились в СВЕЖЕМ поисковом проходе этого прогона
    // (vacancies выше, ДО фильтра исключений: важно само наличие в выдаче
    // JobTech, а не то, прошла ли вакансия наш фильтр). В установившемся
    // режиме это единицы (термины/работодатели стабильны, топ-N по
    // релевантности почти не меняется), не сотни на каждый прогон.
    //
    // ВАЖНО: "не встретилось в этом прогоне" НЕ значит "снята" — это только
    // сокращение пула кандидатов для реальной проверки. Именно сейчас, сразу
    // после сужения OCCUPATIONS (убраны care-термины), вся вернувшаяся из
    // 67 старых вакансий пачка попадёт в кандидаты, будучи полностью живой
    // — она просто больше не матчится нашими терминами. Подтверждение по
    // каждому конкретному id через findRemovedJobTechIds остаётся
    // обязательным и ничего не меняет: эти 67 пройдут проверку как живые
    // (removed: false) и НЕ будут удалены автоматически — снять их может
    // только явный ручной DELETE, не эта логика.
    const foundIds = new Set(vacancies.map((v) => v.external_id));
    const { data: publishedRows, error: publishedError } = await supabase
      .from("vacancies")
      .select("external_id")
      .eq("source_name", JOBTECH_SOURCE_NAME)
      .eq("published", true);

    let deactivated = 0;
    if (publishedError) {
      console.error(`[import:jobtech] published lookup failed: ${publishedError.message}`);
    } else if (publishedRows && publishedRows.length > 0) {
      const candidateIds = publishedRows
        .map((r) => r.external_id)
        .filter((id) => !foundIds.has(id));
      const removedIds = candidateIds.length > 0 ? await findRemovedJobTechIds(candidateIds) : [];
      if (removedIds.length > 0) {
        const { data: deactivatedData, error: deactivateError } = await supabase
          .from("vacancies")
          .delete()
          .eq("source_name", JOBTECH_SOURCE_NAME)
          .in("external_id", removedIds)
          .select("id");
        if (deactivateError) {
          console.error(`[import:jobtech] deactivate failed: ${deactivateError.message}`);
        } else {
          deactivated = deactivatedData?.length ?? 0;
        }
      }
    }

    // Не ждём, пока источник удалит объявление: строка, которая неделю не
    // попадала в наши текущие фильтры, больше не должна оставаться на сайте.
    // Отчёт enriched нужен, чтобы ручное обогащение не исчезало незаметно.
    const stale = await unpublishStaleVacancies(supabase);

    return NextResponse.json({ imported, purged, deactivated, stale, source: "jobtech" });
  } catch (err) {
    // Vercel Runtime Logs пишут код ответа и время выполнения по умолчанию,
    // но НЕ тело JSON — без явного console.error 502 был бы виден в логах
    // как голая цифра, без сообщения, по которому можно отличить недоступную
    // excluded_vacancies (см. префикс в src/lib/importers/exclusions.ts) от
    // сбоя самого фида JobTech (префикс "JobTech (term): ...").
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`[import:jobtech] ${message}`);
    await notifyImportFailure("JobTech", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
