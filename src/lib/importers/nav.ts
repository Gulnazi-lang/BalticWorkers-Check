import {
  NAV_CATCHUP_WINDOW_DAYS,
  NAV_ISCO_PREFIX,
  NAV_MUNICIPALITIES,
  NAV_STYRK08,
} from "@/lib/navConfig";

export const NAV_SOURCE_NAME = "NAV";
const FEED = "https://pam-stilling-feed.nav.no/api/v1/feed";
const DETAIL = "https://pam-stilling-feed.nav.no/api/v1/feedentry";
// Ограничитель прогона — запросы ДЕТАЛЕЙ, а не прочитанные записи ленты.
// Разница решающая при проходе истории: страница истории содержит до 1000
// записей, и прежний лимит в 400 прочитанных записей обрывал прогон после
// первой же страницы. Лента с 14.06.2023 — порядка 1100 страниц, то есть при
// таком лимите догон занял бы 1100 прогонов (неделя с триггером раз в десять
// минут) вместо нескольких часов. Листание дёшево, детали дороги — считаем их.
const MAX_DETAIL_REQUESTS = 400;
// Потолок функции на Hobby с fluid compute — 300 с (см. route.ts, maxDuration).
// Оставляем минуту запаса на запись страницы и checkpoint.
const MAX_RUNTIME_MS = 240_000;

interface FeedItem { date_modified?: string; _feed_entry: { uuid: string; status: string; municipal?: string | null } }
interface FeedPage { id?: string; feed_url?: string; next_url?: string; items?: FeedItem[] }
interface Category { categoryType?: string; code?: string }
interface AdContent {
  expires?: string; published?: string; jobtitle?: string; employer?: { name?: string | null } | null;
  workLocations?: { municipal?: string | null }[]; categoryList?: Category[];
  occupationCategories?: Category[]; link?: string; applicationUrl?: string;
}
export interface NavCursor { cursor_url: string | null; page_id: string | null; etag: string | null; last_modified: string | null }
export interface ImportedNavVacancy {
  title: string; employer_name: string | null; country: "NO"; location: string | null;
  occupation_isco: string; occupation_term: string; hours_per_week: null;
  verification_level: "SOURCE_CONFIRMED"; publication_type: "ORGANIC";
  source_url: string; source_name: typeof NAV_SOURCE_NAME; external_id: string;
  is_demo: false; published: true; legal_minimum_status: "possible" | "unknown";
  legal_minimum_sector: string | null;
  // Срок и дата публикации самого объявления, не нашей строки. Нужны, чтобы
  // снимать истёкшее: у событийного источника «свежесть updated_at» ничего не
  // значит — запись месяцами лежит нетронутой, будучи живой (см. navExpiry.ts).
  source_expires_at: string | null; source_published_at: string | null;
}
export interface NavPageBatch { toUpsert: ImportedNavVacancy[]; toDeactivate: string[]; checkpoint: NavCursor }

const absolute = (url: string) => url.startsWith("http") ? url : `https://pam-stilling-feed.nav.no${url}`;
const municipality = (value?: string | null) => (value ?? "").trim().toLocaleUpperCase("nb-NO");
function styrk08(ad: AdContent): string | null {
  const categories = [...(ad.categoryList ?? []), ...(ad.occupationCategories ?? [])];
  return categories.find((c) => c.categoryType?.toUpperCase() === "STYRK08")?.code ?? null;
}
async function navFetch(url: string, token: string, validators?: NavCursor): Promise<Response> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (validators?.etag) headers["If-None-Match"] = validators.etag;
  if (validators?.last_modified) headers["If-Modified-Since"] = validators.last_modified;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt === 3) return res;
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  throw new Error("NAV request failed");
}
/**
 * Детали объявления. У деактивированного объявления NAV отдаёт 200 с ПУСТЫМ
 * ad_content (проверено 22.08.2026 на записях 2023 года: title, expires и
 * contactList — null). Пустой ответ поэтому надёжный признак «объявления
 * больше нет», и на нём же построена перепроверка в navExpiry.ts.
 */
export async function fetchNavAdContent(uuid: string, token: string): Promise<AdContent | null> {
  const res = await navFetch(`${DETAIL}/${uuid}`, token);
  if (!res.ok) throw new Error(`NAV feedentry ${uuid}: ${res.status}`);
  const ad = ((await res.json()) as { ad_content?: AdContent }).ad_content ?? null;
  return ad && Object.values(ad).some((v) => v !== null && v !== undefined) ? ad : null;
}

async function detail(uuid: string, token: string): Promise<AdContent | null> {
  const res = await navFetch(`${DETAIL}/${uuid}`, token);
  if (!res.ok) throw new Error(`NAV feedentry ${uuid}: ${res.status}`);
  return ((await res.json()) as { ad_content?: AdContent }).ad_content ?? null;
}

/** The route writes each page and only then persists its exact checkpoint. */
export async function walkNavFeed(token: string, cursor: NavCursor | null, onPage: (batch: NavPageBatch) => Promise<void>) {
  const started = Date.now();
  const windowStart = started - NAV_CATCHUP_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  let url = cursor?.cursor_url ?? `${FEED}?last=true`;
  let validators = cursor ?? undefined;
  let records = 0;
  let pages = 0;
  let details = 0;
  // Лимиты проверяются МЕЖДУ страницами: начатую страницу дорабатываем до
  // конца, иначе checkpoint уехал бы на следующую, а часть записей текущей
  // осталась бы необработанной навсегда — лента назад не ходит.
  while (details < MAX_DETAIL_REQUESTS && Date.now() - started < MAX_RUNTIME_MS) {
    const res = await navFetch(url, token, validators);
    if (res.status === 304) return { records, pages, details, unchanged: true };
    if (!res.ok) throw new Error(`NAV feed (${url}): ${res.status} ${res.statusText}`);
    const page = (await res.json()) as FeedPage;
    const items = page.items ?? [];
    // dateMs идёт рядом с каждой кандидатной записью, а не восстанавливается
    // из порядка массива при дедупликации ниже — порядок в пределах страницы
    // нигде не документирован NAV, полагаться на него после сюрпризов с
    // If-Modified-Since не стоит.
    const upsertCandidates: { dateMs: number; vacancy: ImportedNavVacancy }[] = [];
    const toDeactivate: string[] = [];
    for (const item of items) {
      const entry = item._feed_entry;
      // Слишком старая запись — пропускаем, не тратя запрос деталей. Главная
      // статья расхода при проходе истории: см. NAV_CATCHUP_WINDOW_DAYS.
      if (item.date_modified && Date.parse(item.date_modified) < windowStart) continue;
      if (entry.status !== "ACTIVE") { toDeactivate.push(entry.uuid); continue; }
      if (!NAV_MUNICIPALITIES.has(municipality(entry.municipal))) continue;
      const ad = await detail(entry.uuid, token);
      details++;
      if (!ad || (ad.expires && Date.parse(ad.expires) < Date.now())) { toDeactivate.push(entry.uuid); continue; }
      const code = styrk08(ad);
      const match = code ? NAV_STYRK08[code] : undefined;
      if (!code || !match || (!ad.applicationUrl && !ad.link)) continue;
      const location = ad.workLocations?.[0]?.municipal ?? entry.municipal ?? null;
      if (!NAV_MUNICIPALITIES.has(municipality(location))) continue;
      upsertCandidates.push({
        dateMs: item.date_modified ? Date.parse(item.date_modified) : 0,
        vacancy: {
          title: ad.jobtitle ?? "Untitled vacancy", employer_name: ad.employer?.name ?? null,
          country: "NO", location,
          // Префикс обязателен: шведские SSYK и норвежские STYRK08 пересекаются
          // по номерам с разным смыслом — см. NAV_ISCO_PREFIX.
          occupation_isco: `${NAV_ISCO_PREFIX}${code}`, occupation_term: match.term,
          hours_per_week: null, verification_level: "SOURCE_CONFIRMED", publication_type: "ORGANIC",
          source_url: ad.applicationUrl || ad.link!, source_name: NAV_SOURCE_NAME, external_id: entry.uuid,
          is_demo: false, published: true, legal_minimum_status: match.legalMinimumSector ? "possible" : "unknown",
          legal_minimum_sector: match.legalMinimumSector,
          source_expires_at: ad.expires ?? null, source_published_at: ad.published ?? null,
        },
      });
    }
    // Checkpoint должен указывать на КОНКРЕТНУЮ страницу, а не на «?last=true».
    // Проверено 22.08.2026 на проде: сохранённый ?last=true заставляет
    // следующий прогон снова взять последнюю страницу на тот момент, а всё,
    // что лента накопила между прогонами, пройдёт мимо — при суточном cron
    // это ~1000 записей в день. У открытой хвостовой страницы next_url ещё
    // нет, поэтому возвращаемся к ней по её собственному feed_url: когда она
    // закроется, next_url появится и цепочка пойдёт дальше.
    // Один uuid может попасть в кандидаты дважды: страница ленты — не
    // моментальный снимок, а события за окно, и если объявление менялось
    // несколько раз, пока страница ещё открыта, оно встретится в items
    // повторно. Дубликат ключа (source_name, external_id) в одном upsert
    // Postgres отклоняет целиком ("cannot affect row a second time") —
    // проверено на проде 25.08.2026, 502 на ровном месте. Оставляем версию с
    // бОльшим dateMs, а не последнюю по порядку в массиве — порядок внутри
    // страницы NAV нигде не гарантирует.
    const latestByExternalId = new Map<string, { dateMs: number; vacancy: ImportedNavVacancy }>();
    for (const candidate of upsertCandidates) {
      const current = latestByExternalId.get(candidate.vacancy.external_id);
      if (!current || candidate.dateMs >= current.dateMs) {
        latestByExternalId.set(candidate.vacancy.external_id, candidate);
      }
    }
    const dedupedUpsert = [...latestByExternalId.values()].map((c) => c.vacancy);
    const next = page.next_url
      ? absolute(page.next_url)
      : page.feed_url
        ? absolute(page.feed_url)
        : url;
    await onPage({ toUpsert: dedupedUpsert, toDeactivate, checkpoint: {
      cursor_url: next, page_id: page.id ?? null,
      etag: page.next_url ? null : res.headers.get("etag"),
      last_modified: page.next_url ? null : res.headers.get("last-modified"),
    }});
    records += items.length;
    pages++;
    if (!page.next_url) break;
    url = next;
    validators = undefined;
  }
  return { records, pages, details, unchanged: false };
}
