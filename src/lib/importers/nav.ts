import { NAV_MUNICIPALITIES, NAV_STYRK08 } from "@/lib/navConfig";

export const NAV_SOURCE_NAME = "NAV";
const FEED = "https://pam-stilling-feed.nav.no/api/v1/feed";
const DETAIL = "https://pam-stilling-feed.nav.no/api/v1/feedentry";
const MAX_RECORDS = 400;
const MAX_RUNTIME_MS = 45_000;

interface FeedItem { _feed_entry: { uuid: string; status: string; municipal?: string | null } }
interface FeedPage { id?: string; next_url?: string; items?: FeedItem[] }
interface Category { categoryType?: string; code?: string }
interface AdContent {
  expires?: string; jobtitle?: string; employer?: { name?: string | null } | null;
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
async function detail(uuid: string, token: string): Promise<AdContent | null> {
  const res = await navFetch(`${DETAIL}/${uuid}`, token);
  if (!res.ok) throw new Error(`NAV feedentry ${uuid}: ${res.status}`);
  return ((await res.json()) as { ad_content?: AdContent }).ad_content ?? null;
}

/** The route writes each page and only then persists its exact checkpoint. */
export async function walkNavFeed(token: string, cursor: NavCursor | null, onPage: (batch: NavPageBatch) => Promise<void>) {
  const started = Date.now();
  let url = cursor?.cursor_url ?? `${FEED}?last=true`;
  let validators = cursor ?? undefined;
  let records = 0;
  let pages = 0;
  while (records < MAX_RECORDS && Date.now() - started < MAX_RUNTIME_MS) {
    const res = await navFetch(url, token, validators);
    if (res.status === 304) return { records, pages, unchanged: true };
    if (!res.ok) throw new Error(`NAV feed (${url}): ${res.status} ${res.statusText}`);
    const page = (await res.json()) as FeedPage;
    const items = page.items ?? [];
    const toUpsert: ImportedNavVacancy[] = [];
    const toDeactivate: string[] = [];
    for (const item of items) {
      const entry = item._feed_entry;
      if (entry.status !== "ACTIVE") { toDeactivate.push(entry.uuid); continue; }
      if (!NAV_MUNICIPALITIES.has(municipality(entry.municipal))) continue;
      const ad = await detail(entry.uuid, token);
      if (!ad || (ad.expires && Date.parse(ad.expires) < Date.now())) { toDeactivate.push(entry.uuid); continue; }
      const code = styrk08(ad);
      const match = code ? NAV_STYRK08[code] : undefined;
      if (!code || !match || (!ad.applicationUrl && !ad.link)) continue;
      const location = ad.workLocations?.[0]?.municipal ?? entry.municipal ?? null;
      if (!NAV_MUNICIPALITIES.has(municipality(location))) continue;
      toUpsert.push({
        title: ad.jobtitle ?? "Untitled vacancy", employer_name: ad.employer?.name ?? null,
        country: "NO", location, occupation_isco: code, occupation_term: match.term,
        hours_per_week: null, verification_level: "SOURCE_CONFIRMED", publication_type: "ORGANIC",
        source_url: ad.applicationUrl || ad.link!, source_name: NAV_SOURCE_NAME, external_id: entry.uuid,
        is_demo: false, published: true, legal_minimum_status: match.legalMinimumSector ? "possible" : "unknown",
        legal_minimum_sector: match.legalMinimumSector,
      });
    }
    const next = page.next_url ? absolute(page.next_url) : url;
    await onPage({ toUpsert, toDeactivate, checkpoint: {
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
  return { records, pages, unchanged: false };
}
