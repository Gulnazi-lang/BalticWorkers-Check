import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Вакансии, снятые по просьбе работодателя (таблица excluded_vacancies,
 * миграция 014). Общий хелпер для импортёров JobTech и NAV.
 *
 * Два уровня, оба нужны:
 *   * по external_id   — конкретное объявление;
 *   * по employer_name — все объявления работодателя в этом источнике.
 * Одного первого мало: id объявления в источнике не переиспользуется
 * (проверено на живом API 16.08.2026, подробности в 014_excluded_vacancies.sql),
 * поэтому повторная публикация той же вакансии получает НОВЫЙ id и мимо
 * исключения по id проходит. Работодатель, попросивший его не показывать,
 * обычно имеет в виду себя, а не один номер объявления.
 */
export interface ExclusionList {
  externalIds: Set<string>;
  /** Имена работодателей в нижнем регистре — в источниках регистр гуляет. */
  employerNames: Set<string>;
}

interface ExcludedRow {
  external_id: string | null;
  employer_name: string | null;
}

/** Пустой список — «ничего не исключено», безопасный дефолт. */
export function emptyExclusions(): ExclusionList {
  return { externalIds: new Set(), employerNames: new Set() };
}

export async function loadExclusions(
  supabase: SupabaseClient,
  sourceName: string
): Promise<ExclusionList> {
  const { data, error } = await supabase
    .from("excluded_vacancies")
    .select("external_id, employer_name")
    .eq("source_name", sourceName);

  // Сознательно НЕ глотаем ошибку молча: пустой список означал бы «никто не
  // исключён», и импорт вернул бы на сайт вакансию работодателя, которому мы
  // обещали её убрать. Молчаливый фолбэк здесь опаснее упавшего импорта.
  if (error) {
    throw new Error(`excluded_vacancies (${sourceName}): ${error.message}`);
  }

  const list = emptyExclusions();
  for (const row of (data ?? []) as ExcludedRow[]) {
    if (row.external_id) list.externalIds.add(row.external_id);
    if (row.employer_name) list.employerNames.add(row.employer_name.trim().toLowerCase());
  }
  return list;
}

export function isExcluded(
  list: ExclusionList,
  vacancy: { external_id: string; employer_name: string | null }
): boolean {
  if (list.externalIds.has(vacancy.external_id)) return true;
  const employer = vacancy.employer_name?.trim().toLowerCase();
  return employer != null && employer !== "" && list.employerNames.has(employer);
}

/**
 * Убирает из выдачи то, что уже успело попасть в базу до появления записи в
 * excluded_vacancies. Без этого запись в exclusion-лист действовала бы
 * только на будущие объявления, а то, из-за чего работодатель и написал,
 * так и висело бы на сайте.
 *
 * Удаление, а не published = false — тем же способом импортёр NAV убирает
 * пропавшие из фида вакансии, второй механизм скрытия не заводим.
 */
export async function purgeExcluded(
  supabase: SupabaseClient,
  sourceName: string,
  list: ExclusionList
): Promise<number> {
  let removed = 0;

  if (list.externalIds.size > 0) {
    const { data, error } = await supabase
      .from("vacancies")
      .delete()
      .eq("source_name", sourceName)
      .in("external_id", [...list.externalIds])
      .select("id");
    if (error) throw new Error(`purge by external_id: ${error.message}`);
    removed += data?.length ?? 0;
  }

  for (const employer of list.employerNames) {
    // ilike, а не eq: в источнике регистр имени работодателя гуляет
    // ("MIMER ASSISTANS AB" в одном поле, "Mimer Assistans AB" в другом).
    // Спецсимволы ilike (% и _) экранируем — иначе имя вроде "A_B AB"
    // сматчило бы лишнее.
    const pattern = employer.replace(/[\\%_]/g, (c) => `\\${c}`);
    const { data, error } = await supabase
      .from("vacancies")
      .delete()
      .eq("source_name", sourceName)
      .ilike("employer_name", pattern)
      .select("id");
    if (error) throw new Error(`purge by employer_name: ${error.message}`);
    removed += data?.length ?? 0;
  }

  return removed;
}
