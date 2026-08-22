/** NAV geography is deliberately configurable by cluster. */
export const NAV_REGION_CLUSTERS = {
  oslo_akershus: {
    enabled: true,
    municipalities: ["OSLO", "BÆRUM", "ASKER", "LILLESTRØM", "LØRENSKOG", "NORDRE FOLLO", "ULLENSAKER"],
  },
  stavanger_rogaland: {
    enabled: true,
    municipalities: ["STAVANGER", "SANDNES", "SOLA", "RANDABERG"],
  },
  bergen_vestland: {
    enabled: true,
    municipalities: ["BERGEN", "ASKØY", "ØYGARDEN", "BJØRNAFJORDEN"],
  },
  trondheim_trondelag: {
    enabled: true,
    municipalities: ["TRONDHEIM", "MALVIK", "STJØRDAL"],
  },
} as const;

export const NAV_MUNICIPALITIES: ReadonlySet<string> = new Set(
  Object.values(NAV_REGION_CLUSTERS)
    .filter((cluster) => cluster.enabled)
    .flatMap((cluster) => [...cluster.municipalities])
);

export interface NavOccupationMatch {
  term: string;
  legalMinimumSector: string | null;
}

// Exact STYRK08 codes, independent of Bokmål/Nynorsk/English titles.
export const NAV_STYRK08: Record<string, NavOccupationMatch> = {
  "4131": { term: "lagerarbetare", legalMinimumSector: null },
  "8323": { term: "chaufför", legalMinimumSector: "road_freight" },
  "7212": { term: "svetsare", legalMinimumSector: "construction" },
  "7411": { term: "elektriker", legalMinimumSector: "electrical" },
  "7421": { term: "montör", legalMinimumSector: null },
  "7141": { term: "målare", legalMinimumSector: "construction" },
  "8342": { term: "anläggningsmaskinförare", legalMinimumSector: "construction" },
  "9312": { term: "anläggningsarbetare", legalMinimumSector: "construction" },
  "7233": { term: "mekaniker", legalMinimumSector: null },
  "7122": { term: "betongarbetare", legalMinimumSector: "construction" },
  "8332": { term: "kranförare", legalMinimumSector: "construction" },
  "3113": { term: "eltekniker", legalMinimumSector: "electrical" },
};
