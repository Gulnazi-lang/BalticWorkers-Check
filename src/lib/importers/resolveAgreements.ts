import type { SupabaseClient } from "@supabase/supabase-js";
import { agreementCodeForTerm } from "@/lib/occupations";

/**
 * Привязка occupation_term → collective_agreement_id — ТОЛЬКО для тарифов
 * с legal_force = 'universally_binding' (норвежское allmenngjøring: тариф
 * обязателен для любого работодателя в отрасли, кто именно работодатель —
 * не важно). Для 'members_only' (Швеция) договор определяется КОНКРЕТНЫМ
 * работодателем, а не профессией — у personlig assistent минимум четыре
 * разных договора (PAN 25, HÖK 25/AB 25, Fremia/Vårdföretagarna, AB-P), и
 * у работодателя без договора вообще может быть любая ставка (в Швеции
 * нет законного минимума). Автоматическая привязка по профессии для
 * members_only была бы честной на вид и в корне неверной по факту — цифра
 * приписывалась бы вакансиям, на которые договор скорее всего не
 * распространяется. Для Швеции collective_agreement_id проставляется
 * только редакцией на шаге EMPLOYER_CONFIRMED, когда работодатель реально
 * идентифицирован — импортёр и этот хелпер его не трогают.
 *
 * Общая для JobTech и NAV импортёров.
 */
export async function resolveAgreementIds(
  supabase: SupabaseClient,
  country: string,
  occupationTerms: (string | null)[]
): Promise<Map<string, string>> {
  const codes = [
    ...new Set(occupationTerms.map(agreementCodeForTerm).filter((c): c is string => c != null)),
  ];
  const idByCode = new Map<string, string>();
  if (codes.length === 0) return idByCode;

  const { data } = await supabase
    .from("collective_agreements")
    .select("id, code")
    .eq("country", country)
    .eq("legal_force", "universally_binding")
    .in("code", codes);
  for (const a of data ?? []) idByCode.set(a.code, a.id);
  return idByCode;
}

export function collectiveAgreementIdFor(
  idByCode: Map<string, string>,
  occupationTerm: string | null
): string | null {
  const code = agreementCodeForTerm(occupationTerm);
  return code ? (idByCode.get(code) ?? null) : null;
}
