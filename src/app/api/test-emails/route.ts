import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { notifyImportFailure } from "@/lib/importers/failureAlert";
import { createServiceClient } from "@/lib/supabase/service";

// ВРЕМЕННЫЙ роут, только для проверки почты 19.08.2026 (см. CLAUDE.md).
// Удалить отдельным коммитом сразу после проверки — эндпоинт, рассылающий
// письма по секрету, не должен жить в проде дольше, чем нужно для теста.
//
// Не трогает /api/notify и /api/import: использует их же функции
// (sendEmail, notifyImportFailure) напрямую на реальных проверенных
// переменных Vercel, но не переиспользует их код целиком, а значит не может
// случайно уйти всем подписчикам разом и не двигает last_notified_at.

const TEST_RECIPIENT = "baltworkers@gmail.com";

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

async function sendVacancyTest() {
  const supabase = createServiceClient();

  const { data: alert, error: alertError } = await supabase
    .from("job_alerts")
    .select("id, email, query, occupation_isco, country, unsubscribe_token")
    .eq("email", TEST_RECIPIENT)
    .not("confirmed_at", "is", null)
    .is("unsubscribed_at", null)
    .maybeSingle();

  if (alertError) return { error: alertError.message };
  if (!alert) {
    // Ожидаемый результат после отписки: активной подписки на этот адрес
    // больше нет, значит письмо не отправляется — это и есть проверка того,
    // что рассылка не захватывает отписавшихся.
    return { sent: false, reason: "no active confirmed subscription for this email" };
  }

  let matchQuery = supabase
    .from("vacancies")
    .select("title, employer_name, location, source_url")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3);
  if (alert.occupation_isco) matchQuery = matchQuery.eq("occupation_isco", alert.occupation_isco);
  else if (alert.query) matchQuery = matchQuery.ilike("title", `%${alert.query}%`);
  if (alert.country) matchQuery = matchQuery.eq("country", alert.country);

  const { data: matches, error: matchError } = await matchQuery;
  if (matchError) return { error: matchError.message };
  if (!matches || matches.length === 0) {
    return { sent: false, reason: "no published vacancies match this subscription right now" };
  }

  const unsubscribeUrl = `${siteUrl()}/api/alerts/unsubscribe?token=${alert.unsubscribe_token}`;
  const itemsHtml = matches
    .map(
      (v) =>
        `<li><a href="${v.source_url ?? siteUrl()}">${v.title}</a> — ` +
        `${v.employer_name ?? "работодатель уточняется"}, ${v.location ?? "город не указан"}</li>`
    )
    .join("");
  const itemsText = matches.map((v) => `${v.title} — ${v.source_url ?? siteUrl()}`).join("\n");

  await sendEmail(
    alert.email,
    `[ТЕСТ] Новые вакансии на BalticWorkers Check (${matches.length})`,
    `<p><b>Тестовое письмо, проверка шаблона и ссылки отписки.</b></p>` +
      `<p>Новые вакансии по вашему запросу:</p><ul>${itemsHtml}</ul>` +
      `<p style="color:#888;font-size:12px"><a href="${unsubscribeUrl}">Отписаться</a></p>`,
    `ТЕСТ, проверка шаблона и ссылки отписки.\n\nНовые вакансии:\n${itemsText}\n\nОтписаться: ${unsubscribeUrl}`,
    {
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }
  );

  // last_notified_at сознательно не трогаем: это тестовый прогон, а не
  // реальный /api/notify — иначе завтрашняя настоящая рассылка решит, что
  // подписчик уже уведомлён, и промолчит без видимой причины.
  return { sent: true, matches: matches.length };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const kind = request.nextUrl.searchParams.get("kind");

  if (kind === "vacancy") {
    try {
      const result = await sendVacancyTest();
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (kind === "monitor") {
    await notifyImportFailure(
      "test",
      "Это тестовое сообщение от временного роута /api/_debug/test-emails — проверка адреса и From, реальный импорт не затронут."
    );
    return NextResponse.json({ sent: true, note: "notifyImportFailure() called with source=test" });
  }

  return NextResponse.json({ error: "kind must be 'vacancy' or 'monitor'" }, { status: 400 });
}
