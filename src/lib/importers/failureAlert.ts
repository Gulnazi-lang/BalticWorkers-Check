import { sendEmail } from "@/lib/email";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

/**
 * Vercel Cron не присылает уведомления о неудачных запусках по умолчанию.
 * Ошибку импорта нельзя оставлять только в Runtime Logs: иначе отсутствие
 * service role key или excluded_vacancies замечают случайно спустя дни.
 */
export async function notifyImportFailure(source: string, message: string): Promise<void> {
  const recipient = process.env.IMPORT_FAILURE_EMAIL;
  if (!recipient) {
    console.error(`[import:${source}] IMPORT_FAILURE_EMAIL is not configured; failure alert skipped`);
    return;
  }

  const subject = `BalticWorkers Check: импорт ${source} не выполнен`;
  const text = `Импорт ${source} завершился ошибкой:\n${message}\n\nПроверьте Vercel Runtime Logs.`;
  try {
    await sendEmail(recipient, subject, `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`, text);
  } catch (error) {
    // Основной HTTP 5xx всё равно должен уйти Vercel. Не маскируем исходную
    // ошибку вторичной ошибкой почтового провайдера.
    const details = error instanceof Error ? error.message : "unknown error";
    console.error(`[import:${source}] failure alert could not be sent: ${details}`);
  }
}
