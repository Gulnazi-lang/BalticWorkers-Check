import type { SupabaseClient } from "@supabase/supabase-js";
import { occupationTermFromTitle } from "@/lib/occupations";
import { JOBTECH_SOURCE_NAME } from "@/lib/importers/jobtech";
import { NAV_SOURCE_NAME } from "@/lib/importers/nav";

// Считает, сколько опубликованных вакансий карточка покажет НЕ переведёнными
// — то, что 23.09.2026 нашлось случайным взглядом на /ru#jobs ("Extra
// Personal Lokalvårdare till ISS i Lycksele" вместо "Уборщик"), а должно
// было найтись здесь, в ответе прогона.
//
// Два источника — два разных механизма, поэтому и проверка разная:
//
// JobTech: occupation_term иногда законно остаётся null (ось по
// работодателю ищет по имени фирмы, не по нашим терминам — см. комментарий
// у ImportedVacancy.occupation_term в jobtech.ts) — это НЕ ошибка сама по
// себе. Ошибка — когда ни term, ни occupationTermFromTitle(заголовок) не
// находят совпадения: тогда карточка отдаёт сырой шведский текст. Число
// само по себе не финальный вердикт (часть — управленческие/непрофильные
// роли вне нашего набора профессий, и это нормально), но должно быть
// видно, чтобы решать по факту, а не искать глазами на сайте.
//
// NAV: occupation_term всегда берётся детерминированно из NAV_STYRK08 (см.
// navConfig.ts), никогда не гадается по заголовку — значит null никогда не
// бывает. Риск другой: код добавили в navConfig.ts, а миграцию с подписью
// в occupation_labels забыли — ровно то, что чинили в 022 и повторно грозило
// с 025/026. Проверяется join'ом, а не предположением.

export interface JobTechLabelCoverage {
  /** Опубликованных строк, где ни term, ни заголовок не дают перевод. */
  untranslated: number;
  /** До пяти примеров заголовков — чтобы не открывать сайт, чтобы понять, что искать. */
  samples: string[];
}

export interface NavLabelCoverage {
  /** occupation_isco вакансий NAV, для которых в occupation_labels нет ни одной строки. */
  missingLabelCodes: string[];
}

export async function checkJobTechLabelCoverage(
  supabase: SupabaseClient
): Promise<JobTechLabelCoverage> {
  const { data, error } = await supabase
    .from("vacancies")
    .select("title, occupation_term")
    .eq("source_name", JOBTECH_SOURCE_NAME)
    .eq("published", true);
  if (error) throw new Error(`JobTech label coverage lookup failed: ${error.message}`);

  const untranslatedTitles = (data ?? [])
    .filter((row) => !row.occupation_term && !occupationTermFromTitle(row.title as string))
    .map((row) => row.title as string);

  return { untranslated: untranslatedTitles.length, samples: untranslatedTitles.slice(0, 5) };
}

export async function checkNavLabelCoverage(supabase: SupabaseClient): Promise<NavLabelCoverage> {
  const [{ data: vacancyRows, error: vacancyError }, { data: labelRows, error: labelError }] =
    await Promise.all([
      supabase
        .from("vacancies")
        .select("occupation_isco")
        .eq("source_name", NAV_SOURCE_NAME)
        .eq("published", true)
        .not("occupation_isco", "is", null),
      // Одна опорная локаль достаточна: подписи заводятся миграцией сразу на
      // все пять языков одним INSERT (см. 020/025) — частичный пропуск
      // локали без пропуска кода самим по себе не случался.
      supabase.from("occupation_labels").select("isco_code").eq("locale", "lv"),
    ]);
  if (vacancyError) throw new Error(`NAV label coverage lookup failed: ${vacancyError.message}`);
  if (labelError) throw new Error(`occupation_labels lookup failed: ${labelError.message}`);

  const labeled = new Set((labelRows ?? []).map((row) => row.isco_code as string));
  const usedCodes = new Set((vacancyRows ?? []).map((row) => row.occupation_isco as string));
  const missingLabelCodes = [...usedCodes].filter((code) => !labeled.has(code)).sort();

  return { missingLabelCodes };
}
