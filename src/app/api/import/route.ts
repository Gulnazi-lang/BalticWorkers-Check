import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchJobTechVacancies, JOBTECH_SOURCE_NAME } from "@/lib/importers/jobtech";
import { isExcluded, loadExclusions, purgeExcluded } from "@/lib/importers/exclusions";
import { collectiveAgreementIdFor, resolveAgreementIds } from "@/lib/importers/resolveAgreements";
import { createServiceClient } from "@/lib/supabase/service";

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
    const vacancies = await fetchJobTechVacancies();
    const supabase = createServiceClient();

    // Вакансии, снятые по просьбе работодателя (миграция 014). Две вещи
    // сразу: отсеять их из свежей выдачи и убрать то, что успело попасть в
    // базу ДО обращения — иначе запись в exclusion-лист действовала бы
    // только на будущие объявления, а висящее на сайте так и осталось бы.
    const exclusions = await loadExclusions(supabase, JOBTECH_SOURCE_NAME);
    const purged = await purgeExcluded(supabase, JOBTECH_SOURCE_NAME, exclusions);
    const allowed = vacancies.filter((v) => isExcluded(exclusions, v) === false);

    if (allowed.length === 0) {
      return NextResponse.json({ imported: 0, purged, source: "jobtech" });
    }

    // Привязка вакансии к договору по occupation_term — детерминированная,
    // не требует решения человека (в отличие от employer_agreement_status,
    // которое остаётся редакционным полем и импортёром не трогается).
    const agreementIdByCode = await resolveAgreementIds(
      supabase,
      "SE",
      allowed.map((v) => v.occupation_term)
    );
    const vacanciesWithAgreement = allowed.map((v) => ({
      ...v,
      collective_agreement_id: collectiveAgreementIdFor(agreementIdByCode, v.occupation_term),
    }));

    const { data, error } = await supabase
      .from("vacancies")
      .upsert(vacanciesWithAgreement, { onConflict: "source_name,external_id" })
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ imported: data?.length ?? 0, purged, source: "jobtech" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
