import type { SupabaseClient } from "@supabase/supabase-js";

// Строка, которая не попала ни в один успешный импорт 7 дней, больше не
// считается актуально отслеживаемой. Это отдельная защита от проверки
// findRemovedJobTechIds: там мы знаем конкретный id и проверяем, снял ли его
// источник; здесь вакансия могла остаться живой, но выпасть из наших фильтров.
export const STALE_VACANCY_DAYS = 7;

interface StaleVacancyRow {
  id: string;
  title: string;
  employer_name: string | null;
  source_name: string | null;
  external_id: string | null;
  wage_amount: number | null;
  housing_status: string | null;
  travel_status: string | null;
  collective_agreement: string | null;
  collective_agreement_id: string | null;
  agreement_status: string | null;
  employer_agreement_status: string | null;
}

export interface StaleVacancyReport {
  days: number;
  deactivated: number;
  // Не просто число: если правило когда-либо снимет вручную обогащённую
  // карточку, это сразу видно в ответе cron/ручного запуска.
  enriched: Array<Pick<StaleVacancyRow, "id" | "title" | "employer_name" | "source_name" | "external_id">>;
}

function hasTermsBeyondSkeleton(row: StaleVacancyRow): boolean {
  return (
    row.wage_amount !== null ||
    row.housing_status === "included" ||
    row.housing_status === "deducted" ||
    row.housing_status === "available" ||
    row.travel_status === "included" ||
    row.travel_status === "deducted" ||
    row.collective_agreement !== null ||
    row.collective_agreement_id !== null ||
    row.agreement_status === "named" ||
    row.agreement_status === "exists_unnamed" ||
    row.employer_agreement_status === "bound" ||
    row.employer_agreement_status === "not_bound"
  );
}

/**
 * Снимает с публикации, но не удаляет, вакансии, которые не обновлялись N
 * дней. Новый upsert сам вернёт published=true, если вакансия снова попадёт в
 * текущую выдачу. Ошибка намеренно пробрасывается: тихо оставлять устаревшие
 * вакансии противоречит обещанию платформы об актуальности.
 */
export async function unpublishStaleVacancies(
  supabase: SupabaseClient,
  days = STALE_VACANCY_DAYS
): Promise<StaleVacancyReport> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("vacancies")
    .select(
      "id, title, employer_name, source_name, external_id, wage_amount, housing_status, travel_status, collective_agreement, collective_agreement_id, agreement_status, employer_agreement_status"
    )
    .eq("published", true)
    .eq("is_demo", false)
    .lt("updated_at", cutoff);

  if (error) throw new Error(`stale vacancies lookup failed: ${error.message}`);

  const stale = (data ?? []) as StaleVacancyRow[];
  const enriched = stale
    .filter(hasTermsBeyondSkeleton)
    .map(({ id, title, employer_name, source_name, external_id }) => ({
      id,
      title,
      employer_name,
      source_name,
      external_id,
    }));

  if (stale.length > 0) {
    const { error: updateError } = await supabase
      .from("vacancies")
      .update({ published: false })
      .in(
        "id",
        stale.map((row) => row.id)
      );
    if (updateError) throw new Error(`stale vacancies unpublish failed: ${updateError.message}`);
  }

  return { days, deactivated: stale.length, enriched };
}
