// Профсоюзы для страницы /your-rights — единый источник правды. Названия и
// ссылки проверены 23.09.2026 по официальным источникам (не по памяти):
// LO Norge (lo.no/hvem-vi-er/forbundene), LO Sverige (lo.se/english/affiliates),
// сайт каждого профсоюза отдельно для отрасли и ссылки на вступление.
// Ошибка в названии профсоюза на этой странице обесценивает всю страницу для
// читателя, ради которого она написана, — поэтому имена и домены живут в
// одном месте, а не размножены по пяти локалям.
//
// sectorKey — ключ подписи отрасли в словаре (yourRights.sector*), сам
// перевод — в i18n, здесь только структура и факты.

export interface UnionEntry {
  sectorKey:
    | "sectorConstruction"
    | "sectorCleaning"
    | "sectorHospitality"
    | "sectorElectricians"
    | "sectorIndustry"
    | "sectorTransport";
  union: string;
  url: string;
}

export const NORWAY_UNIONS: readonly UnionEntry[] = [
  // Fellesforbundet: строительство и промышленность — крупнейший профсоюз LO
  // в частном секторе. Гостиницы/рестораны — тот же профсоюз, через
  // Riksavtalen (тарифное соглашение с NHO Reiseliv) и avdeling 250.
  { sectorKey: "sectorConstruction", union: "Fellesforbundet", url: "https://medlemskap.fellesforbundet.no/" },
  { sectorKey: "sectorHospitality", union: "Fellesforbundet", url: "https://medlemskap.fellesforbundet.no/" },
  // Norsk Arbeidsmandsforbund: официально охватывает "construction, cleaning,
  // maintenance, industry..." — подтверждено на lo.no.
  { sectorKey: "sectorCleaning", union: "Norsk Arbeidsmandsforbund", url: "https://arbeidsmandsforbundet.no/bli-medlem/" },
  { sectorKey: "sectorElectricians", union: "EL og IT Forbundet", url: "https://elogit.no/medlemskap-og-fordeler/" },
] as const;

export const SWEDEN_UNIONS: readonly UnionEntry[] = [
  { sectorKey: "sectorConstruction", union: "Byggnads", url: "https://www.byggnads.se/medlemskapet/bli-medlem/" },
  { sectorKey: "sectorHospitality", union: "Hotell- och restaurangfacket (HRF)", url: "https://www.hrf.net/" },
  { sectorKey: "sectorCleaning", union: "Fastighetsanställdas Förbund (Fastighets)", url: "https://www.fastighets.se/medlem/bli-medlem/medlemsansokan/" },
  { sectorKey: "sectorIndustry", union: "IF Metall", url: "https://www.ifmetall.se/" },
  { sectorKey: "sectorTransport", union: "Svenska Transportarbetareförbundet (Transport)", url: "https://www.transport.se/" },
] as const;
