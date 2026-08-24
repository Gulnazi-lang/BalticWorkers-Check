import type { Locale } from "@/i18n/config";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface OccupationOption {
  code: string;
  label: string;
  count: number;
}

/**
 * Список профессий для поиска — из фактических occupation_isco
 * опубликованных вакансий (view public.occupation_counts), а не из того,
 * что человек введёт своими словами. Пустых пунктов быть не может по
 * определению: каждый код в списке гарантированно что-то находит.
 * Подписи — из справочника occupation_labels по текущей локали, не из
 * названия источника (то остаётся на карточке, там оно уместно).
 */
export async function getOccupationOptions(locale: Locale): Promise<OccupationOption[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const [{ data: counts, error: countsError }, { data: labels, error: labelsError }] =
    await Promise.all([
      supabase.from("occupation_counts").select("occupation_isco, vacancy_count"),
      supabase.from("occupation_labels").select("isco_code, label").eq("locale", locale),
    ]);
  if (countsError) console.error("occupation_counts:", countsError.message);
  if (labelsError) console.error("occupation_labels:", labelsError.message);

  const labelByCode = new Map((labels ?? []).map((l) => [l.isco_code as string, l.label as string]));

  // Группируем по ПОДПИСИ, а не по коду. Причина появилась 24.08.2026 вместе
  // с норвежскими вакансиями: шведский SSYK и норвежский STYRK08 — разные
  // классификаторы, и одна профессия приходит разными кодами (уборка в
  // Норвегии это 9112, 9111 и 5151 сразу). Без группировки в списке было бы
  // три одинаковых пункта «Уборщик», и человек не понял бы, чем они
  // отличаются. Значение опции — все коды группы через запятую; фильтр и
  // подписки это понимают (см. vacancies.ts и api/notify).
  const grouped = new Map<string, { codes: string[]; count: number }>();
  for (const c of counts ?? []) {
    const code = c.occupation_isco as string;
    // Код без подписи в справочнике — такое бывает, если в базу попал новый
    // код, для которого ещё не завели перевод: честнее показать код, чем
    // молчать или подставлять случайный текст. Такие пункты не группируются
    // между собой — у каждого своя «подпись».
    const label = labelByCode.get(code) ?? code;
    const entry = grouped.get(label) ?? { codes: [], count: 0 };
    entry.codes.push(code);
    entry.count += c.vacancy_count as number;
    grouped.set(label, entry);
  }

  return [...grouped.entries()]
    .map(([label, { codes, count }]) => ({ code: codes.sort().join(","), label, count }))
    .sort((a, b) => b.count - a.count);
}
