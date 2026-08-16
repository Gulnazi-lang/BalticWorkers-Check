// Импорт вакансий из NAV (arbeidsplassen.no, Норвегия) — pam-stilling-feed.
//
// В отличие от JobTech это НЕ поиск по ключевым словам, а непрерывный
// журнал событий (публикация/изменение/деактивация) с историей примерно
// с 2019 года. Сервер не фильтрует по профессии — фильтруем сами по
// заголовку (см. Occupation.noKeywords в @/lib/occupations).
//
// If-Modified-Since проверен вживую 15.08.2026: сервер реально прыгает к
// записям от этой даты, а не отдаёт всю историю заново — это и есть курсор,
// а не просто проверка кэша. Курсор хранится в public.import_cursors.
//
// Обязательно по условиям использования API: просроченные объявления
// (ad_content.expires в прошлом) не показывать, даже если status ещё
// "ACTIVE" — статус в фиде может отставать от реального истечения срока.

import { OCCUPATIONS } from "@/lib/occupations";

// Значение vacancies.source_name для этого источника — см. пояснение
// у JOBTECH_SOURCE_NAME.
export const NAV_SOURCE_NAME = "NAV";

const NAV_FEED_BASE = "https://pam-stilling-feed.nav.no/api/v1/feed";
const NAV_FEEDENTRY_BASE = "https://pam-stilling-feed.nav.no/api/v1/feedentry";

// Защита от слишком долгого запуска cron — 20 страниц по ~80 записей
// достаточно с запасом для ежедневной дельты после того, как курсор
// догонит текущее время.
const MAX_PAGES_PER_RUN = 20;

interface NavFeedItem {
  date_modified: string;
  _feed_entry: {
    uuid: string;
    status: string;
    title: string;
    businessName?: string;
    municipal?: string;
  };
}

interface NavFeedPage {
  next_url?: string;
  items: NavFeedItem[];
}

interface NavAdContent {
  expires: string;
  workLocations?: { municipal?: string | null }[];
  jobtitle?: string;
  employer?: { name?: string | null } | null;
  link: string;
}

interface NavFeedEntryDetail {
  ad_content?: NavAdContent;
}

export interface ImportedNavVacancy {
  title: string;
  employer_name: string | null;
  country: "NO";
  location: string | null;
  occupation_isco: null; // у NAV своя классификация (STYRK08) — не смешиваем со шведским ISCO
  occupation_term: string;
  hours_per_week: null; // NAV даёt только Heltid/Deltid, точных часов нет — не гадаем
  verification_level: "SOURCE_CONFIRMED";
  publication_type: "ORGANIC";
  source_url: string;
  source_name: typeof NAV_SOURCE_NAME;
  external_id: string;
  is_demo: false;
  published: true;
}

export interface NavImportResult {
  toUpsert: ImportedNavVacancy[];
  toDeactivate: string[]; // external_id (uuid) вакансий, которые пропали или деактивированы
  nextCursor: string; // ISO-дата — передать следующему запуску как since
}

function matchOccupationTerm(text: string): string | null {
  const lower = text.toLowerCase();
  for (const o of OCCUPATIONS) {
    if (o.noKeywords?.some((kw) => lower.includes(kw.toLowerCase()))) return o.term;
  }
  return null;
}

async function fetchPage(
  url: string,
  token: string,
  ifModifiedSince?: string
): Promise<NavFeedPage> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (ifModifiedSince) headers["If-Modified-Since"] = ifModifiedSince;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`NAV feed (${url}): ${res.status} ${res.statusText}`);
  return (await res.json()) as NavFeedPage;
}

async function fetchDetail(uuid: string, token: string): Promise<NavFeedEntryDetail> {
  const res = await fetch(`${NAV_FEEDENTRY_BASE}/${uuid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`NAV feedentry ${uuid}: ${res.status} ${res.statusText}`);
  return (await res.json()) as NavFeedEntryDetail;
}

/**
 * since — ISO-дата, откуда продолжать. При первом запуске (курсора ещё нет)
 * вызывающий код должен передать разумное окно (несколько дней назад), а
 * не начало эпохи фида — иначе первый прогон будет перебирать историю
 * примерно с 2019 года.
 */
export async function fetchNavVacancies(token: string, since: string): Promise<NavImportResult> {
  const toUpsert: ImportedNavVacancy[] = [];
  const toDeactivate: string[] = [];
  let maxSeenMs = new Date(since).getTime();

  let url = NAV_FEED_BASE;
  let ifModifiedSince: string | undefined = new Date(since).toUTCString();

  for (let page = 0; page < MAX_PAGES_PER_RUN; page++) {
    const data = await fetchPage(url, token, ifModifiedSince);
    ifModifiedSince = undefined; // дальше идём по next_url, повторный скачок не нужен

    for (const item of data.items) {
      const modifiedMs = new Date(item.date_modified).getTime();
      if (modifiedMs > maxSeenMs) maxSeenMs = modifiedMs;

      if (item._feed_entry.status !== "ACTIVE") {
        toDeactivate.push(item._feed_entry.uuid);
        continue;
      }

      const term = matchOccupationTerm(
        `${item._feed_entry.title} ${item._feed_entry.businessName ?? ""}`
      );
      if (!term) continue; // не наша категория — не тратим запрос на детали

      const detail = await fetchDetail(item._feed_entry.uuid, token);
      const ad = detail.ad_content;
      if (!ad) continue;

      if (new Date(ad.expires).getTime() < Date.now()) continue;

      toUpsert.push({
        title: ad.jobtitle || item._feed_entry.title,
        employer_name: ad.employer?.name ?? null,
        country: "NO",
        location: ad.workLocations?.[0]?.municipal ?? item._feed_entry.municipal ?? null,
        occupation_isco: null,
        occupation_term: term,
        hours_per_week: null,
        verification_level: "SOURCE_CONFIRMED",
        publication_type: "ORGANIC",
        source_url: ad.link,
        source_name: NAV_SOURCE_NAME,
        external_id: item._feed_entry.uuid,
        is_demo: false,
        published: true,
      });
    }

    if (!data.next_url) break;
    url = data.next_url.startsWith("http")
      ? data.next_url
      : `https://pam-stilling-feed.nav.no${data.next_url}`;
    // Вежливая пауза между запросами к публичному API.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return { toUpsert, toDeactivate, nextCursor: new Date(maxSeenMs).toISOString() };
}
