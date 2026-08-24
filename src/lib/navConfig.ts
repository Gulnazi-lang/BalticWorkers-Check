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
  // Автосервис тоже охвачен allmenngjøring — forskrift для bilbransjen,
  // 223,50 NOK/час для свежего фагбрева и 237,00 при опыте от года, в силе с
  // 15.06.2026. Пропустить это значило бы промолчать о законной ставке там,
  // где она есть.
  "7231": { term: "fordonsmekaniker", legalMinimumSector: "motor_vehicle_repair" },
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
  // 8322 «Bil-, drosje- og varebilførere» НЕ берём (проверено 24.08.2026 после
  // того, как этот код завёл в базу двух таксистов). Треть записей — такси и
  // drosje: нужен kjøreseddel, местный экзамен и норвежский для пассажиров.
  // Остальное — pizzasjåfør, bilbud, budbil: местная развозка, то есть ровно
  // тот локальный поток, ради ухода от которого введён regionRestricted.
  // Отдельно про ставку: allmenngjøring грузоперевозок с 01.06.2025 покрывает
  // машины свыше 2,5 т, включая фургоны, но такси не покрывает никогда.
  // Код смешанный, значит любой legalMinimumSector на нём был бы обещанием
  // законного минимума части людей, у которых его нет. Грузовики берём
  // кодом 8332, он чистый.
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

  // --- Уборка (24.08.2026). Отрасль охвачена allmenngjøring: forskrift
  // 2024-10-21-2545 с изменением 2025-05-28-957, минимум 236,54 NOK/час для
  // 18+ с 15.06.2025. Измерено на 48 объявлениях в наших кластерах: язык не
  // упомянут вообще в 60% (в уходе — 0% допускают английский, поэтому уход
  // не берём), жильё 2.1%, дорога 0%, про сам allmenngjøring не пишет никто —
  // ставку человек узнает только от нас. Housekeeping в отелях приходит этим
  // же кодом 9112, отдельной ветки для гостиниц не нужно.
  "9112": { term: "städare", legalMinimumSector: "cleaning" },
  "9111": { term: "städare", legalMinimumSector: "cleaning" },
  "5151": { term: "städare", legalMinimumSector: "cleaning" },

  // --- Кухня без зала (24.08.2026). Forskrift 2024-10-21-2543, минимум
  // 204,79 NOK/час для 20+ с 15.06.2025. На 145 объявлениях: язык не упомянут
  // в 64%, из заполнивших Arbeidsspråk 54% допускают английский. Официанты
  // (5131) и ресепшн (4224/4226) сознательно не берутся: работа с гостями
  // предполагает язык, даже когда объявление об этом молчит.
  "5120": { term: "kock", legalMinimumSector: "hospitality" },
  "9412": { term: "köksbiträde", legalMinimumSector: "hospitality" },
  "5246": { term: "köksbiträde", legalMinimumSector: "hospitality" },

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

/**
 * Окно догона: записи ленты старше этого возраста пропускаются БЕЗ запроса
 * деталей.
 *
 * Нужно потому, что прыгнуть в ленте на нужную дату нечем — If-Modified-Since
 * на этом API отдаёт 500/504 (проверено 21.08.2026 на всех глубинах), и
 * единственный способ дойти до недавних записей — пройти ленту с её начала,
 * с 14.06.2023. Листать дёшево (страницы истории плотные, до 1000 записей),
 * дорого запрашивать детали: они нужны на каждую запись, прошедшую фильтр
 * коммуны. Порог отсекает эту трату на трёх годах истории.
 *
 * 60 дней — решение Шакро от 22.08.2026 по измеренной кривой: за 60 дней в
 * базу попадает 81.7% доступных в фиде объявлений сегмента, следующие 30 дней
 * добавляют лишь 7 процентных пунктов вдвое дороже. Медианный срок жизни
 * объявления — 34 дня, так что более старое в основном доживает последние
 * недели.
 */
export const NAV_CATCHUP_WINDOW_DAYS = 60;
