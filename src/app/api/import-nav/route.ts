import { NextResponse, type NextRequest } from "next/server";
import { walkNavFeed, NAV_SOURCE_NAME, type NavCursor } from "@/lib/importers/nav";
import { isExcluded, loadExclusions, purgeExcluded } from "@/lib/importers/exclusions";
import { unpublishStaleVacancies } from "@/lib/importers/staleness";
import { expireNavVacancies } from "@/lib/importers/navExpiry";
import { notifyImportFailure } from "@/lib/importers/failureAlert";
import { createServiceClient } from "@/lib/supabase/service";

// Hobby с fluid compute даёт 300 с и по умолчанию, но полагаться на дефолт
// проекта не стоит: прогон догона реально использует минуты, а не секунды.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secrets = [process.env.IMPORT_SECRET, process.env.CRON_SECRET].filter(Boolean);
  if (!secrets.length) return NextResponse.json({ error: "IMPORT_SECRET или CRON_SECRET не настроен" }, { status: 500 });
  if (!secrets.some((s) => request.headers.get("authorization") === `Bearer ${s}`)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const token = process.env.NAV_API_TOKEN;
  if (!token) return NextResponse.json({ error: "NAV_API_TOKEN не настроен" }, { status: 500 });
  try {
    const supabase = createServiceClient();
    const { data: cursorRow, error: cursorError } = await supabase.from("import_cursors")
      .select("cursor_url,page_id,etag,last_modified").eq("source", "nav").maybeSingle();
    if (cursorError) throw new Error(`NAV cursor lookup failed: ${cursorError.message}`);
    const exclusions = await loadExclusions(supabase, NAV_SOURCE_NAME);
    const purged = await purgeExcluded(supabase, NAV_SOURCE_NAME, exclusions);
    let imported = 0;
    let deactivated = 0;
    const walk = await walkNavFeed(token, (cursorRow as NavCursor | null) ?? null, async (batch) => {
      const allowed = batch.toUpsert.filter((vacancy) => !isExcluded(exclusions, vacancy));
      if (allowed.length) {
        const { data, error } = await supabase.from("vacancies").upsert(allowed, { onConflict: "source_name,external_id" }).select("id");
        if (error) throw new Error(`NAV upsert failed: ${error.message}`);
        imported += data?.length ?? 0;
      }
      if (batch.toDeactivate.length) {
        const { data, error } = await supabase.from("vacancies").delete().eq("source_name", NAV_SOURCE_NAME).in("external_id", batch.toDeactivate).select("id");
        if (error) throw new Error(`NAV deactivate failed: ${error.message}`);
        deactivated += data?.length ?? 0;
      }
      const { error } = await supabase.from("import_cursors").upsert({ source: "nav", ...batch.checkpoint, initialized_at: cursorRow ? undefined : new Date().toISOString() }, { onConflict: "source" });
      if (error) throw new Error(`NAV cursor save failed: ${error.message}`);
    });
    // Сначала снимаем истёкшее и перепроверяем самое давнее у источника —
    // условия NAV требуют убирать неактивное, а событий об истечении срока
    // фид не присылает. Затем общее правило (оно норвежские строки не
    // трогает, см. staleness.ts) — чтобы ответ прогона по-прежнему содержал
    // отчёт по остальным источникам.
    const expiry = await expireNavVacancies(supabase, token);
    const stale = await unpublishStaleVacancies(supabase);
    return NextResponse.json({ imported, deactivated, purged, expiry, stale, source: "nav", ...walk });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`[import:nav] ${message}`);
    await notifyImportFailure("NAV", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
