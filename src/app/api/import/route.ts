import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchJobTechVacancies } from "@/lib/importers/jobtech";
import { agreementCodeForTerm } from "@/lib/occupations";
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

    // Привязка вакансии к договору по occupation_term — детерминированная,
    // не требует решения человека (в отличие от employer_agreement_status,
    // которое остаётся редакционным полем и импортёром не трогается).
    const agreementCodes = [
      ...new Set(
        vacancies
          .map((v) => agreementCodeForTerm(v.occupation_term))
          .filter((code): code is string => code != null)
      ),
    ];
    const agreementIdByCode = new Map<string, string>();
    if (agreementCodes.length > 0) {
      const { data: agreements } = await supabase
        .from("collective_agreements")
        .select("id, code")
        .eq("country", "SE")
        .in("code", agreementCodes);
      for (const a of agreements ?? []) agreementIdByCode.set(a.code, a.id);
    }

    const vacanciesWithAgreement = vacancies.map((v) => {
      const code = agreementCodeForTerm(v.occupation_term);
      const collective_agreement_id = code ? (agreementIdByCode.get(code) ?? null) : null;
      return { ...v, collective_agreement_id };
    });

    const { data, error } = await supabase
      .from("vacancies")
      .upsert(vacanciesWithAgreement, { onConflict: "source_name,external_id" })
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
