import type { SupabaseClient } from "@supabase/supabase-js";
import { NAV_MUNICIPALITIES } from "@/lib/navConfig";
import { fetchNavAdContent, NAV_SOURCE_NAME } from "@/lib/importers/nav";

// Правило устаревания для NAV — отдельное от семидневного правила JobTech
// (src/lib/importers/staleness.ts), потому что модели источников разные.
// JobTech каждый прогон перезаливает всю выдачу, поэтому свежий updated_at
// там означает «вакансия всё ещё в выдаче». NAV — журнал событий: строка
// лежит нетронутой ровно до тех пор, пока работодатель не отредактирует
// объявление. Семидневное правило сняло бы живые норвежские вакансии на
// седьмой день — медианный срок жизни объявления 34 дня (замер 22.08.2026,
// 1041 объявление).
//
// Снимаем — то есть УДАЛЯЕМ, а не прячем: условия использования NAV требуют
// убирать объявление из сервиса, когда оно перестало быть активным.

// Страховка на случай пустого expires: NAV декларирует, что дольше полугода
// объявление активным не бывает. Применяется ТОЛЬКО к записям без expires
// (2.5% выборки). К записям с expires не применяется: у 8.8% объявлений срок
// длиннее 180 дней от публикации (максимум — 1442 дня), и это как раз
// длинные наборы кадровых агентств вроде «Mechanics, welders and piping» —
// то есть самое ценное для целевой аудитории, а не мусор.
export const NAV_MAX_LIFETIME_DAYS = 183;

// Сколько самых давно не проверявшихся вакансий перепроверяем за прогон.
// Один запрос feedentry на строку, ~0.12 с — сорок строк это ~5 секунд.
export const NAV_RECHECK_BATCH = 40;

interface NavRow {
  id: string;
  external_id: string | null;
  location: string | null;
  title: string;
  employer_name: string | null;
  wage_amount: number | null;
  housing_status: string | null;
  travel_status: string | null;
  collective_agreement: string | null;
  collective_agreement_id: string | null;
}

export interface NavExpiryReport {
  /** Удалены: без названия карточку нельзя честно показать пользователю. */
  missingTitle: number;
  /** Удалены: срок объявления у источника прошёл. */
  expired: number;
  /** Удалены: expires не было, а с публикации прошло больше полугода. */
  overdue: number;
  /** Сколько строк перепроверено запросом к источнику. */
  rechecked: number;
  /** Из перепроверенных: объявления у источника больше нет. */
  vanished: number;
  /** Из перепроверенных: коммуна больше не входит во включённые кластеры. */
  outOfRegion: number;
  /**
   * Удалённые строки, в которые редакция вкладывала ручную работу. Условия
   * NAV не оставляют выбора — неактивное объявление должно исчезнуть, — но
   * знать о потере редакция должна, поэтому список едет в ответ прогона и в
   * письмо о сбое, если оно будет.
   */
  enrichedRemoved: Array<Pick<NavRow, "id" | "title" | "employer_name" | "external_id">>;
}

const ENRICHED = "wage_amount, housing_status, travel_status, collective_agreement, collective_agreement_id";
const SELECT = `id, external_id, location, title, employer_name, ${ENRICHED}`;

function isEnriched(row: NavRow): boolean {
  return (
    row.wage_amount !== null ||
    row.housing_status === "included" ||
    row.housing_status === "deducted" ||
    row.housing_status === "available" ||
    row.travel_status === "included" ||
    row.travel_status === "deducted" ||
    row.collective_agreement !== null ||
    row.collective_agreement_id !== null
  );
}

const municipality = (value?: string | null) => (value ?? "").trim().toLocaleUpperCase("nb-NO");

async function removeRows(
  supabase: SupabaseClient,
  rows: NavRow[],
  report: NavExpiryReport
): Promise<number> {
  if (rows.length === 0) return 0;
  const { data, error } = await supabase
    .from("vacancies")
    .delete()
    .in("id", rows.map((row) => row.id))
    .select("id");
  if (error) throw new Error(`NAV expiry delete failed: ${error.message}`);
  for (const row of rows.filter(isEnriched)) {
    report.enrichedRemoved.push({
      id: row.id,
      title: row.title,
      employer_name: row.employer_name,
      external_id: row.external_id,
    });
  }
  return data?.length ?? 0;
}

/**
 * Снимает норвежские вакансии, срок которых истёк, и перепроверяет у
 * источника самые давно не трогавшиеся строки.
 *
 * Перепроверка закрывает дыру, которую expires сам не закрывает: если прогон
 * упал или курсор проскочил страницы, событие INACTIVE могло не дойти, и
 * снятое досрочно объявление висело бы у нас до своего expires — а он бывает
 * и через год. Признак надёжный: у деактивированного объявления NAV отдаёт
 * 200 с пустым ad_content.
 */
export async function expireNavVacancies(
  supabase: SupabaseClient,
  token: string,
  recheckBatch = NAV_RECHECK_BATCH
): Promise<NavExpiryReport> {
  const report: NavExpiryReport = {
    missingTitle: 0,
    expired: 0,
    overdue: 0,
    rechecked: 0,
    vanished: 0,
    outOfRegion: 0,
    enrichedRemoved: [],
  };
  const now = new Date();

  // Страховка для строк, импортированных до запрета пустых заголовков.
  const { data: missingTitleRows, error: missingTitleError } = await supabase
    .from("vacancies")
    .select(SELECT)
    .eq("source_name", NAV_SOURCE_NAME)
    .eq("title", "");
  if (missingTitleError) throw new Error(`NAV missing-title lookup failed: ${missingTitleError.message}`);
  report.missingTitle = await removeRows(supabase, (missingTitleRows ?? []) as NavRow[], report);

  const { data: expiredRows, error: expiredError } = await supabase
    .from("vacancies")
    .select(SELECT)
    .eq("source_name", NAV_SOURCE_NAME)
    .lt("source_expires_at", now.toISOString());
  if (expiredError) throw new Error(`NAV expired lookup failed: ${expiredError.message}`);
  report.expired = await removeRows(supabase, (expiredRows ?? []) as NavRow[], report);

  const cutoff = new Date(now.getTime() - NAV_MAX_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
  const { data: overdueRows, error: overdueError } = await supabase
    .from("vacancies")
    .select(SELECT)
    .eq("source_name", NAV_SOURCE_NAME)
    .is("source_expires_at", null)
    .lt("source_published_at", cutoff.toISOString());
  if (overdueError) throw new Error(`NAV overdue lookup failed: ${overdueError.message}`);
  report.overdue = await removeRows(supabase, (overdueRows ?? []) as NavRow[], report);

  if (recheckBatch > 0) {
    const { data: oldest, error: oldestError } = await supabase
      .from("vacancies")
      .select(SELECT)
      .eq("source_name", NAV_SOURCE_NAME)
      .eq("published", true)
      .order("updated_at", { ascending: true })
      .limit(recheckBatch);
    if (oldestError) throw new Error(`NAV recheck lookup failed: ${oldestError.message}`);

    const gone: NavRow[] = [];
    for (const row of (oldest ?? []) as NavRow[]) {
      if (!row.external_id) continue;
      report.rechecked += 1;
      // Коммуна могла выпасть из включённых кластеров после правки конфига —
      // у JobTech это ловило семидневное правило, у NAV ловить больше нечему.
      if (row.location && !NAV_MUNICIPALITIES.has(municipality(row.location))) {
        gone.push(row);
        report.outOfRegion += 1;
        continue;
      }
      const ad = await fetchNavAdContent(row.external_id, token);
      if (!ad || (ad.expires && Date.parse(ad.expires) < Date.now())) {
        gone.push(row);
        report.vanished += 1;
        continue;
      }
      // Живая — двигаем updated_at, чтобы очередь перепроверки шла по кругу,
      // а не упиралась в одни и те же строки.
      const { error } = await supabase
        .from("vacancies")
        .update({
          source_expires_at: ad.expires ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw new Error(`NAV recheck touch failed: ${error.message}`);
    }
    await removeRows(supabase, gone, report);
  }

  return report;
}
