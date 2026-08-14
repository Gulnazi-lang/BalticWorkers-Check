import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/service";
import type { JobAlertRow } from "@/types/alert";

// Тот же секрет, что у /api/import: IMPORT_SECRET для ручного запуска,
// CRON_SECRET Vercel присылает сам. Один набор секретов на оба cron-роута.
function isAuthorized(request: NextRequest): boolean {
  const secrets = [process.env.IMPORT_SECRET, process.env.CRON_SECRET].filter(
    (secret): secret is string => Boolean(secret)
  );
  if (secrets.length === 0) return false;
  const authorization = request.headers.get("authorization");
  return secrets.some((secret) => authorization === `Bearer ${secret}`);
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://baltic-workers-check.vercel.app";
}

interface MatchedVacancy {
  title: string;
  employer_name: string | null;
  location: string | null;
  source_url: string | null;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: alerts, error: alertsError } = await supabase
    .from("job_alerts")
    .select("id, email, query, country, confirmed_at, last_notified_at, unsubscribe_token")
    .not("confirmed_at", "is", null)
    .is("unsubscribed_at", null);

  if (alertsError) {
    return NextResponse.json({ error: alertsError.message }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const alert of (alerts ?? []) as Pick<
    JobAlertRow,
    "id" | "email" | "query" | "country" | "confirmed_at" | "last_notified_at" | "unsubscribe_token"
  >[]) {
    const since = alert.last_notified_at ?? alert.confirmed_at!;

    let matchQuery = supabase
      .from("vacancies")
      .select("title, employer_name, location, source_url")
      .eq("published", true)
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);

    if (alert.query) matchQuery = matchQuery.ilike("title", `%${alert.query}%`);
    if (alert.country) matchQuery = matchQuery.eq("country", alert.country);

    const { data: matches, error: matchError } = await matchQuery;

    if (matchError) {
      errors.push(`${alert.email}: ${matchError.message}`);
      continue;
    }

    if (matches && matches.length > 0) {
      const list = matches as MatchedVacancy[];
      const unsubscribeUrl = `${siteUrl()}/api/alerts/unsubscribe?token=${alert.unsubscribe_token}`;
      const itemsHtml = list
        .map(
          (v) =>
            `<li><a href="${v.source_url ?? siteUrl()}">${v.title}</a> — ` +
            `${v.employer_name ?? "работодатель уточняется"}, ${v.location ?? "город не указан"}</li>`
        )
        .join("");
      const itemsText = list.map((v) => `${v.title} — ${v.source_url ?? siteUrl()}`).join("\n");

      try {
        await sendEmail(
          alert.email,
          `Новые вакансии на BalticWorkers Check (${list.length})`,
          `<p>Новые вакансии по вашему запросу:</p><ul>${itemsHtml}</ul>` +
            `<p style="color:#888;font-size:12px"><a href="${unsubscribeUrl}">Отписаться</a></p>`,
          `Новые вакансии:\n${itemsText}\n\nОтписаться: ${unsubscribeUrl}`
        );
        sent++;
      } catch (err) {
        errors.push(`${alert.email}: ${err instanceof Error ? err.message : "send failed"}`);
        // Не двигаем last_notified_at — попробуем снова в следующий прогон.
        continue;
      }
    }

    await supabase
      .from("job_alerts")
      .update({ last_notified_at: new Date().toISOString() })
      .eq("id", alert.id);

    // Вежливая пауза между отправками.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return NextResponse.json({ alerts: alerts?.length ?? 0, sent, errors });
}
