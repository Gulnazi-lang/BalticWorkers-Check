// Импорт реальных вакансий из JobTech (Arbetsförmedlingen, Швеция).
// https://jobsearch.api.jobtechdev.se/ — публичный API, ключ не нужен.
//
// Важно: verification_level здесь ВСЕГДА 'SOURCE_CONFIRMED' и никогда выше.
// Это единственный уровень, который честно описывает то, что делает
// автоматический импорт — «нашли в официальном источнике, условия не
// проверены». EMPLOYER_CONFIRMED и WORKER_CONFIRMED требуют человека и
// меняются только вручную редакцией — импортёр их писать не должен.

import { OCCUPATIONS, occupationTermFromTitle } from "@/lib/occupations";
import { CONTRACTOR_EMPLOYERS, PRIORITY_REGIONS } from "@/lib/contractors";

const JOBTECH_SEARCH_URL = "https://jobsearch.api.jobtechdev.se/search";
const JOBTECH_AD_URL = "https://jobsearch.api.jobtechdev.se/ad";

// Значение vacancies.source_name для этого источника. Константа, а не
// литерал в двух местах: по нему же ищется exclusion-лист, и расхождение
// строк тихо отключило бы фильтр снятых вакансий.
export const JOBTECH_SOURCE_NAME = "Arbetsförmedlingen";

interface JobTechHit {
  id: string;
  headline: string;
  webpage_url: string;
  removed?: boolean;
  employer?: { name?: string | null } | null;
  workplace_address?: { municipality?: string | null } | null;
  occupation_group?: { legacy_ams_taxonomy_id?: string | null } | null;
  scope_of_work?: { min?: number | null; max?: number | null } | null;
}

interface JobTechSearchResponse {
  hits?: JobTechHit[];
}

// Полная занятость в Швеции — 40 ч/нед. scope_of_work.max — доля этой
// ставки в процентах, приходит почти всегда (проверено на реальных
// вакансиях), в отличие от зарплаты (salary_description почти всегда
// null, а salary_type — расплывчатая категория без единицы измерения,
// её честно нельзя смаппить на wage_type — не трогаем).
const FULL_TIME_HOURS_SE = 40;

function hoursFromScopeOfWork(scope: JobTechHit["scope_of_work"]): number | null {
  const max = scope?.max;
  if (max == null || max <= 0 || max > 100) return null;
  return Math.round((FULL_TIME_HOURS_SE * max) / 100);
}

export interface ImportedVacancy {
  title: string;
  employer_name: string | null;
  country: "SE";
  location: string | null;
  occupation_isco: string | null;
  // null — вакансия найдена по работодателю (см. CONTRACTOR_EMPLOYERS), а
  // заголовок не совпал ни с одним из терминов поиска. Не ошибка: именно
  // такие вакансии ("Helpers", "Dumperchaufförer" и т.п. у N Kraft) и есть
  // причина, по которой ось по работодателю вообще была добавлена —
  // отбрасывать их значило бы вернуться к тому же пробелу, который эта
  // ось должна закрыть.
  occupation_term: string | null;
  hours_per_week: number | null;
  verification_level: "SOURCE_CONFIRMED";
  publication_type: "ORGANIC";
  source_url: string;
  source_name: typeof JOBTECH_SOURCE_NAME;
  external_id: string;
  is_demo: false;
  published: true;
}

// region — JobTech Search region= (см. src/lib/contractors.ts, PRIORITY_REGIONS).
// Несколько значений работают как OR — подтверждено вживую 16.08.2026.
function buildSearchUrl(params: Record<string, string>, regions: readonly string[] | undefined): string {
  const url = new URL(JOBTECH_SEARCH_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  for (const region of regions ?? []) url.searchParams.append("region", region);
  return url.toString();
}

async function fetchOccupation(
  term: string,
  limit: number,
  regions?: readonly string[]
): Promise<JobTechHit[]> {
  const url = buildSearchUrl({ q: term, limit: String(limit) }, regions);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`JobTech (${term}): ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as JobTechSearchResponse;
  return data.hits ?? [];
}

// Ось по работодателю (см. src/lib/contractors.ts) — нечёткий текстовый
// поиск по employer=, подтверждено вживую 16.08.2026. Обязательно с
// регионом: без него один подрядчик вроде N Kraft Bemanning (1547 вакансий
// по всей Швеции) залил бы выдачу вакансиями вне целевого сегмента.
async function fetchByEmployer(
  employerName: string,
  limit: number,
  regions: readonly string[]
): Promise<JobTechHit[]> {
  const url = buildSearchUrl({ employer: employerName, limit: String(limit) }, regions);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`JobTech (employer ${employerName}): ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as JobTechSearchResponse;
  return data.hits ?? [];
}

function toImportedVacancy(hit: JobTechHit, occupationTerm: string | null): ImportedVacancy {
  return {
    title: hit.headline,
    employer_name: hit.employer?.name ?? null,
    country: "SE",
    location: hit.workplace_address?.municipality ?? null,
    occupation_isco: hit.occupation_group?.legacy_ams_taxonomy_id ?? null,
    occupation_term: occupationTerm,
    hours_per_week: hoursFromScopeOfWork(hit.scope_of_work),
    verification_level: "SOURCE_CONFIRMED",
    publication_type: "ORGANIC",
    source_url: hit.webpage_url,
    source_name: JOBTECH_SOURCE_NAME,
    external_id: hit.id,
    is_demo: false,
    published: true,
  };
}

// Снятие вакансий, пропавших у источника — то, чего JobTech-импортёру не
// хватало (в отличие от NAV, у которого этот механизм есть с 15.08.2026,
// через toDeactivate/status фида). У JobTech нет событийного фида статусов
// — только поиск по терминам/работодателям с ограниченным limit, а
// поисковая выдача не сигнал "вакансия пропала": она могла просто выпасть
// из топ-N по релевантности, оставаясь живой. Единственный надёжный сигнал
// — прямой запрос к самой вакансии по id (/ad/{id}): removed:true или 404
// значит вакансию реально сняли у источника, не то что поиск её не нашёл.
//
// Без этого шага работодатель, снявший объявление, продолжал бы висеть на
// сайте бессрочно — прямой удар по «проверенным условиям» (человек
// откликается на пропавшую вакансию) и по обещанию с /employers/* убрать
// вакансию по запросу (см. excluded_vacancies, миграция 014 — это другой
// механизм, для снятия ПО ПРОСЬБЕ работодателя; этот — для вакансий,
// которые пропали сами, без обращения).
export async function findRemovedJobTechIds(externalIds: readonly string[]): Promise<string[]> {
  const removed: string[] = [];
  for (const id of externalIds) {
    const res = await fetch(`${JOBTECH_AD_URL}/${encodeURIComponent(id)}`, {
      headers: { accept: "application/json" },
    });
    if (res.status === 404) {
      removed.push(id);
    } else if (res.ok) {
      const ad = (await res.json()) as { removed?: boolean };
      if (ad.removed) removed.push(id);
    }
    // Сетевая ошибка/иной статус — НЕ считаем снятой: отсутствие ответа не
    // доказательство, что вакансии больше нет, а ложное снятие ломает то
    // же обещание, которое эта проверка должна защищать.
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return removed;
}

export async function fetchJobTechVacancies(limitPerOccupation = 5): Promise<ImportedVacancy[]> {
  // Общий Set на обе оси (термины + работодатели): одна и та же вакансия
  // легко приходит по обеим — грävmaskinist от N Kraft matчится и термином
  // "grävmaskinist", и работодателем "N Kraft Bemanning". Дедуп здесь, а не
  // только на уникальном индексе БД, важен не для целостности (индекс и
  // так не даст создать вторую строку), а чтобы не отправить в один upsert
  // два объекта с одинаковым (source_name, external_id) — Postgres на
  // "ON CONFLICT DO UPDATE" ругается на повторное затрагивание той же
  // строки в одном запросе ("cannot affect row a second time").
  const seen = new Set<string>();
  const results: ImportedVacancy[] = [];

  for (const occ of OCCUPATIONS) {
    const regions = occ.regionRestricted ? PRIORITY_REGIONS : undefined;
    const hits = await fetchOccupation(occ.term, limitPerOccupation, regions);
    for (const hit of hits) {
      if (hit.removed || seen.has(hit.id) || !hit.webpage_url) continue;
      seen.add(hit.id);
      results.push(toImportedVacancy(hit, occ.term));
    }
    // Вежливая пауза между запросами к публичному API.
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  for (const employerName of CONTRACTOR_EMPLOYERS) {
    const hits = await fetchByEmployer(employerName, limitPerOccupation, PRIORITY_REGIONS);
    for (const hit of hits) {
      if (hit.removed || seen.has(hit.id) || !hit.webpage_url) continue;
      seen.add(hit.id);
      results.push(toImportedVacancy(hit, occupationTermFromTitle(hit.headline)));
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}
