import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface PartnerStatus {
  isPlaceholder: boolean;
}

/**
 * Статус партнёров по slug. Если Supabase не настроен или запрос не удался —
 * считаем партнёра заглушкой. Безопасный дефолт: лучше лишний раз показать
 * «специалиста подключаем», чем выдать несуществующего партнёра за реального.
 */
export async function getPartnerStatuses(
  slugs: string[]
): Promise<Record<string, PartnerStatus>> {
  const fallback = Object.fromEntries(slugs.map((slug) => [slug, { isPlaceholder: true }]));
  if (!isSupabaseConfigured()) return fallback;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("slug, is_placeholder")
    .in("slug", slugs);

  if (error || !data) return fallback;

  const result = { ...fallback };
  for (const row of data) {
    result[row.slug] = { isPlaceholder: row.is_placeholder };
  }
  return result;
}
