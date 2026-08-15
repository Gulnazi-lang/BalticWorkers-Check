"use server";

import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE, isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export interface SubscribeState {
  status: "idle" | "success" | "error";
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNIQUE_VIOLATION = "23505";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://baltic-workers-check.vercel.app";
}

export async function subscribeToAlerts(
  _prevState: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const rawLocale = String(formData.get("locale") ?? "");
  const locale = isEnabledLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = await getDictionary(locale);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const query = String(formData.get("q") ?? "").trim();
  const rawCountry = String(formData.get("country") ?? "");
  const country = rawCountry === "SE" || rawCountry === "NO" ? rawCountry : "";

  if (!EMAIL_PATTERN.test(email)) {
    return { status: "error", message: dict.alerts.errorInvalidEmail };
  }

  const confirmToken = randomBytes(24).toString("base64url");
  const unsubscribeToken = randomBytes(24).toString("base64url");

  const supabase = await createClient();
  const { error } = await supabase.from("job_alerts").insert({
    email,
    query,
    country,
    confirm_token: confirmToken,
    unsubscribe_token: unsubscribeToken,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { status: "success", message: dict.alerts.errorAlreadySubscribed };
    }
    return { status: "error", message: dict.alerts.errorSaveFailed };
  }

  const confirmUrl = `${siteUrl()}/api/alerts/confirm?token=${confirmToken}`;

  // Письмо намеренно остаётся на русском независимо от локали формы —
  // локализация транзакционных писем вне текущего объёма задачи (см. спеку
  // i18n: /api/* не локализуем).
  try {
    await sendEmail(
      email,
      "Подтвердите подписку — BalticWorkers Check",
      `<p>Подтвердите подписку на новые вакансии по вашему запросу.</p>` +
        `<p><a href="${confirmUrl}">Подтвердить подписку</a></p>` +
        `<p style="color:#888;font-size:12px">Если вы не оставляли заявку — просто игнорируйте это письмо.</p>`,
      `Подтвердите подписку: ${confirmUrl}\n\nЕсли вы не оставляли заявку — просто игнорируйте это письмо.`
    );
  } catch (err) {
    console.error("Не удалось отправить письмо подтверждения:", err);
    return { status: "error", message: dict.alerts.errorMailFailed };
  }

  return { status: "success", message: dict.alerts.success };
}
