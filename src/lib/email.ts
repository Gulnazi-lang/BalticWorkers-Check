// Отправка писем через Resend с верифицированного balticworkers.eu.
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = process.env.ALERTS_FROM_EMAIL || "BalticWorkers Check <onboarding@resend.dev>";

interface SendEmailOptions {
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  options: SendEmailOptions = {}
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
    body: JSON.stringify({
      from: options.from ?? FROM_ADDRESS,
      to,
      subject,
      html,
      text,
      reply_to: options.replyTo ?? process.env.REPLY_TO_EMAIL,
      headers: options.headers,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}
