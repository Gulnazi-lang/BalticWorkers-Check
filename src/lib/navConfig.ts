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

// Точные коды STYRK08, независимые от языка заголовка (bokmål/nynorsk/английский).
//
// Список построен 22.08.2026 на реальных данных фида, а не по справочнику SSB:
// 1563 объявления целевого сегмента из публичного поиска arbeidsplassen
// запрошены в фиде поштучно, у 1015 пришёл код STYRK08 (2.5% записей кода не
// имеют вовсе). Прежний список из 12 кодов покрывал 19% сегмента и содержал
// три неверных соответствия: 8332 — не крановщики, а дальнобойщики; 7122 — не
// бетонщики, а плиточники; 4131 — такого кода в выдаче нет вообще (склад это
// 4321). Текущий список покрывает 83.9% записей с кодом.
//
// Берём СЕМЕЙСТВАМИ, а не отдельными кодами. Причина измерена: на 284
// объявлениях, где профессия стоит прямо в заголовке, код совпал с ожидаемым
// в 84.9%, а расхождения почти всегда — соседний код того же семейства
// (forskalingssnekker → 7114 Betongarbeidere, «Tømrer (Bas)» → 3123
// Arbeidsleder). При отборе семейством такое перетекание перестаёт быть
// потерей, и проверка по тексту не нужна.
//
// legalMinimumSector — отрасль норвежского allmenngjøring (общеобязательного
// тарифа). Ставится только там, где отрасль следует из самой профессии;
// точную ставку по одному коду не назначаем (см. CLAUDE.md, NAV Phase 2).
export const NAV_STYRK08: Record<string, NavOccupationMatch> = {
  // --- Стройка и отделка (71xx) — берём семейство целиком
  "7112": { term: "murare", legalMinimumSector: "construction" },
  "7113": { term: "anläggningsarbetare", legalMinimumSector: "construction" },
  "7114": { term: "betongarbetare", legalMinimumSector: "construction" },
  "7115": { term: "snickare", legalMinimumSector: "construction" },
  "7119": { term: "anläggningsarbetare", legalMinimumSector: "construction" },
  "7121": { term: "takläggare", legalMinimumSector: "construction" },
  "7122": { term: "golvläggare", legalMinimumSector: "construction" },
  "7124": { term: "isolerare", legalMinimumSector: "construction" },
  "7125": { term: "glasmästare", legalMinimumSector: "construction" },
  "7126": { term: "rörläggare", legalMinimumSector: "construction" },
  "7127": { term: "kylmontör", legalMinimumSector: "construction" },
  "7131": { term: "målare", legalMinimumSector: "construction" },
  "7132": { term: "målare", legalMinimumSector: "construction" },
  "7133": { term: "fasadarbetare", legalMinimumSector: "construction" },

  // --- Металл и механика (72xx)
  "7212": { term: "svetsare", legalMinimumSector: "construction" },
  "7213": { term: "plåtslagare", legalMinimumSector: "construction" },
  "7214": { term: "plåtslagare", legalMinimumSector: "construction" },
  "7215": { term: "riggare", legalMinimumSector: "construction" },
  "7222": { term: "verktygsmakare", legalMinimumSector: null },
  "7223": { term: "verktygsmakare", legalMinimumSector: null },
  "7231": { term: "fordonsmekaniker", legalMinimumSector: null },
  "7233": { term: "mekaniker", legalMinimumSector: null },

  // --- Электро (74xx)
  "7411": { term: "elektriker", legalMinimumSector: "electrical" },
  "7412": { term: "automationstekniker", legalMinimumSector: "electrical" },
  "7413": { term: "eltekniker", legalMinimumSector: "electrical" },

  // --- Монтаж (82xx)
  "8211": { term: "montör", legalMinimumSector: null },
  "8219": { term: "montör", legalMinimumSector: null },

  // --- Транспорт и спецтехника (83xx). Пассажирские перевозки (8331
  // Bussjåfører) сознательно не берём: нужен норвежский и местная
  // сертификация, целевой аудитории такая вакансия не подходит.
  "8322": { term: "chaufför", legalMinimumSector: "road_freight" },
  "8332": { term: "chaufför", legalMinimumSector: "road_freight" },
  "8342": { term: "anläggningsmaskinförare", legalMinimumSector: "construction" },
  "8343": { term: "kranförare", legalMinimumSector: "construction" },
  "8344": { term: "truckförare", legalMinimumSector: null },

  // --- Склад и логистика
  "4321": { term: "lagerarbetare", legalMinimumSector: null },
  "4322": { term: "terminalarbetare", legalMinimumSector: null },
  "9333": { term: "terminalarbetare", legalMinimumSector: null },

  // --- Разнорабочие. 9629 «Andre hjelpearbeidere» взят сознательно: на
  // проверенной выборке (32 объявления) там оказалась сплошь стройка
  // («Hjelpearbeider – takarbeid / Roofing Helper»), а неквалифицированный
  // рабочий и есть целевая аудитория. Выборка смещена в сторону стройки —
  // если после первого догона в код полезет уборка или кухня, отсекать
  // придётся отдельно.
  "9312": { term: "hjälparbetare", legalMinimumSector: "construction" },
  "9313": { term: "hjälparbetare", legalMinimumSector: "construction" },
  "9329": { term: "hjälparbetare", legalMinimumSector: null },
  "9629": { term: "hjälparbetare", legalMinimumSector: null },

  // --- Промышленные операторы. 8160 — рыбо- и пищепереработка, куда
  // балтийцев возят так же, как на стройку.
  "8160": { term: "industrioperatör", legalMinimumSector: null },
  "8114": { term: "betongarbetare", legalMinimumSector: "construction" },

  // --- Пограничное: бригадиры на стройке. Взято потому, что на выборке
  // больше половины записей с этим кодом — обычные плотники с завышенной
  // классификацией («Tømrer», «Tømrerbas»), а не руководители.
  "3123": { term: "snickare", legalMinimumSector: "construction" },
};

/**
 * Префикс для vacancies.occupation_isco у норвежских вакансий.
 *
 * Обязателен: шведские SSYK и норвежские STYRK08 — разные классификаторы с
 * пересекающейся нумерацией. В базе на 22.08.2026 код 7113 стоит у шведских
 * betongarbetare, а в STYRK08 7113 — Steinhoggere (каменотёсы); 7114 —
 * зеркально наоборот. Без префикса фильтр профессий на главной склеил бы
 * разные профессии под одной подписью. Шведские значения остаются без
 * префикса, поэтому существующие подписки job_alerts не ломаются.
 */
export const NAV_ISCO_PREFIX = "NO-";
