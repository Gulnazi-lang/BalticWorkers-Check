// Импорт реальных вакансий из JobTech (Arbetsförmedlingen, Швеция).
// https://jobsearch.api.jobtechdev.se/ — публичный API, ключ не нужен.
//
// Важно: verification_level здесь ВСЕГДА 'SOURCE_CONFIRMED' и никогда выше.
// Это единственный уровень, который честно описывает то, что делает
// автоматический импорт — «нашли в официальном источнике, условия не
// проверены». EMPLOYER_CONFIRMED и WORKER_CONFIRMED требуют человека и
// меняются только вручную редакцией — импортёр их писать не должен.

import { OCCUPATIONS } from "@/lib/occupations";

const JOBTECH_SEARCH_URL = "https://jobsearch.api.jobtechdev.se/search";

interface JobTechHit {
  id: string;
  headline: string;
  webpage_url: string;
  removed?: boolean;
  employer?: { name?: string | null } | null;
  workplace_address?: { municipality?: string | null } | null;
  occupation_group?: { legacy_ams_taxonomy_id?: string | null } | null;
}

export interface ImportedVacancy {
  title: string;
  employer_name: string | null;
  country: "SE";
  location: string | null;
  occupation_isco: string | null;
  occupation_term: string;
  verification_level: "SOURCE_CONFIRMED";
  publication_type: "ORGANIC";
  source_url: string;
  source_name: string;
  external_id: string;
  is_demo: false;
  published: true;
}

async function fetchOccupation(term: string, limit: number): Promise<JobTechHit[]> {
  const url = `${JOBTECH_SEARCH_URL}?q=${encodeURIComponent(term)}&limit=${limit}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`JobTech (${term}): ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { hits?: JobTechHit[] };
  return data.hits ?? [];
}

export async function fetchJobTechVacancies(limitPerOccupation = 5): Promise<ImportedVacancy[]> {
  const seen = new Set<string>();
  const results: ImportedVacancy[] = [];

  for (const { term } of OCCUPATIONS) {
    const hits = await fetchOccupation(term, limitPerOccupation);
    for (const hit of hits) {
      if (hit.removed || seen.has(hit.id) || !hit.webpage_url) continue;
      seen.add(hit.id);
      results.push({
        title: hit.headline,
        employer_name: hit.employer?.name ?? null,
        country: "SE",
        location: hit.workplace_address?.municipality ?? null,
        occupation_isco: hit.occupation_group?.legacy_ams_taxonomy_id ?? null,
        occupation_term: term,
        verification_level: "SOURCE_CONFIRMED",
        publication_type: "ORGANIC",
        source_url: hit.webpage_url,
        source_name: "Arbetsförmedlingen",
        external_id: hit.id,
        is_demo: false,
        published: true,
      });
    }
    // Вежливая пауза между запросами к публичному API.
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}
