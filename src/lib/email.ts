// Отправка писем через Resend. Пока нет верифицированного домена под
// NordicWork Check, письма идут с общего тестового адреса Resend
// (onboarding@resend.dev) — доставляемость ограничена, для реального запуска
// нужен свой домен (тот же .lv, что и для сайта) и верификация в Resend.
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = process.env.ALERTS_FROM_EMAIL || "NordicWork Check <onboarding@resend.dev>";

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY не настроен");
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}
