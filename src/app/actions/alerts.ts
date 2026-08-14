"use server";

import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

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
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const query = String(formData.get("q") ?? "").trim();
  const rawCountry = String(formData.get("country") ?? "");
  const country = rawCountry === "SE" || rawCountry === "NO" ? rawCountry : "";

  if (!EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "Введите корректный email." };
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
      return { status: "success", message: "Вы уже подписаны на эти уведомления." };
    }
    return { status: "error", message: "Не получилось сохранить подписку. Попробуйте позже." };
  }

  const confirmUrl = `${siteUrl()}/api/alerts/confirm?token=${confirmToken}`;

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
    return {
      status: "error",
      message: "Подписка сохранена, но письмо не отправилось. Попробуйте ещё раз позже.",
    };
  }

  return { status: "success", message: "Проверьте почту и подтвердите подписку по ссылке." };
}
