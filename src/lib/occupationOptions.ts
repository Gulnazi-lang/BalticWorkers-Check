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

  return (counts ?? [])
    .map((c) => {
      const code = c.occupation_isco as string;
      return {
        code,
        // Код без подписи в справочнике — такое бывает, если в базу попал
        // новый ISCO, для которого ещё не завели перевод: честнее показать
        // код, чем молчать или подставлять случайный текст.
        label: labelByCode.get(code) ?? code,
        count: c.vacancy_count as number,
      };
    })
    .sort((a, b) => b.count - a.count);
}
