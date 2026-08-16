import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchNavVacancies, NAV_SOURCE_NAME } from "@/lib/importers/nav";
import { isExcluded, loadExclusions, purgeExcluded } from "@/lib/importers/exclusions";
import { collectiveAgreementIdFor, resolveAgreementIds } from "@/lib/importers/resolveAgreements";
import { createServiceClient } from "@/lib/supabase/service";

const CURSOR_SOURCE = "nav";
// Разумное окно для самого первого запуска (курсора ещё нет в БД) — иначе
// пришлось бы перебирать историю фида примерно с 2019 года.
const BOOTSTRAP_WINDOW_DAYS = 3;

// GET, а не POST — та же логика, что и у /api/import: без лишней настройки
// триггерится Vercel Cron, защита не в методе, а в секрете.
export async function GET(request: NextRequest) {
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

  // Публичный токен NAV нестабилен (ротируется нерегулярно) — до получения
  // приватного (запрос отправлен 15.08.2026, ответа ждём) держим его в
  // переменной окружения, чтобы замена была правкой одного значения.
  const token = process.env.NAV_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "NAV_API_TOKEN не настроен" }, { status: 500 });
  }

  try {
    const supabase = createServiceClient();

    const { data: cursorRow } = await supabase
      .from("import_cursors")
      .select("cursor_time")
      .eq("source", CURSOR_SOURCE)
      .maybeSingle();
    const since =
      cursorRow?.cursor_time ??
      new Date(Date.now() - BOOTSTRAP_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { toUpsert, toDeactivate, nextCursor } = await fetchNavVacancies(token, since);

    // Снятые по просьбе работодателя (миграция 014) — см. тот же блок в
    // /api/import. Здесь это особенно важно: NAV читается журналом событий,
    // и любое изменение объявления вернуло бы его в toUpsert заново.
    const exclusions = await loadExclusions(supabase, NAV_SOURCE_NAME);
    const purged = await purgeExcluded(supabase, NAV_SOURCE_NAME, exclusions);
    const allowed = toUpsert.filter((v) => isExcluded(exclusions, v) === false);

    let imported = 0;
    if (allowed.length > 0) {
      const agreementIdByCode = await resolveAgreementIds(
        supabase,
        "NO",
        allowed.map((v) => v.occupation_term)
      );
      const vacanciesWithAgreement = allowed.map((v) => {
        const collectiveAgreementId = collectiveAgreementIdFor(agreementIdByCode, v.occupation_term);
        return {
          ...v,
          collective_agreement_id: collectiveAgreementId,
          // См. тот же блок в /api/import: agreement_status = 'named' —
          // обязательное условие CHECK-констрейнта, когда FK задан.
          ...(collectiveAgreementId ? { agreement_status: "named" } : {}),
        };
      });
      const { data, error } = await supabase
        .from("vacancies")
        .upsert(vacanciesWithAgreement, { onConflict: "source_name,external_id" })
        .select("id");
      if (error) {
        console.error(`[import:nav] vacancies upsert failed: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      imported = data?.length ?? 0;
    }

    let deactivated = 0;
    if (toDeactivate.length > 0) {
      const { data, error } = await supabase
        .from("vacancies")
        .delete()
        .eq("source_name", NAV_SOURCE_NAME)
        .in("external_id", toDeactivate)
        .select("id");
      if (error) {
        console.error(`[import:nav] deactivate failed: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      deactivated = data?.length ?? 0;
    }

    await supabase
      .from("import_cursors")
      .upsert({ source: CURSOR_SOURCE, cursor_time: nextCursor }, { onConflict: "source" });

    return NextResponse.json({ imported, deactivated, purged, source: "nav", cursor: nextCursor });
  } catch (err) {
    // См. пояснение к тому же блоку в /api/import: без console.error тело
    // 502-ответа не попадёт в Vercel Runtime Logs, только код и время.
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`[import:nav] ${message}`);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
