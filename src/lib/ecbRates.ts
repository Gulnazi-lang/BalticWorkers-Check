export interface EcbRates {
  date: string; // 'YYYY-MM-DD', дата курса из фида ЕЦБ
  ratesByCurrency: Record<string, number>; // сколько единиц валюты за 1 EUR
}

const ECB_FEED_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

/**
 * Официальный дневной справочный курс ЕЦБ — не для расчёта переводов,
 * только чтобы показать пользователю примерный эквивалент в евро рядом с
 * суммой в SEK/NOK, без пересчёта в голове. ЕЦБ публикует курс раз в
 * рабочий день (~16:00 CET) — кэшируем на стороне Next.js, дёргать при
 * каждом рендере карточки незачем.
 */
export async function fetchEcbRates(): Promise<EcbRates | null> {
  try {
    const res = await fetch(ECB_FEED_URL, { next: { revalidate: 12 * 60 * 60 } });
    if (!res.ok) return null;
    const xml = await res.text();

    const dateMatch = xml.match(/<Cube time=['"]([\d-]+)['"]>/);
    if (!dateMatch) return null;

    const ratesByCurrency: Record<string, number> = {};
    const rateRegex = /<Cube currency=['"]([A-Z]{3})['"] rate=['"]([\d.]+)['"]\s*\/>/g;
    let match: RegExpExecArray | null;
    while ((match = rateRegex.exec(xml))) {
      ratesByCurrency[match[1]] = parseFloat(match[2]);
    }
    if (Object.keys(ratesByCurrency).length === 0) return null;

    return { date: dateMatch[1], ratesByCurrency };
  } catch {
    return null;
  }
}

/** amount в currency -> примерно в EUR; null если валюта уже EUR или курса нет в фиде. */
export function toEur(amount: number, currency: string, rates: EcbRates): number | null {
  if (currency === "EUR" || currency === "€") return null;
  const rate = rates.ratesByCurrency[currency];
  if (!rate) return null;
  return amount / rate;
}
