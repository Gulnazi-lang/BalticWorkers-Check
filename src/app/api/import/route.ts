import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchJobTechVacancies } from "@/lib/importers/jobtech";
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
    if (vacancies.length === 0) {
      return NextResponse.json({ imported: 0, source: "jobtech" });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("vacancies")
      .upsert(vacancies, { onConflict: "source_name,external_id" })
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ imported: data?.length ?? 0, source: "jobtech" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
