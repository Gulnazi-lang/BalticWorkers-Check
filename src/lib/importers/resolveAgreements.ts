import type { SupabaseClient } from "@supabase/supabase-js";
import { agreementCodeForTerm } from "@/lib/occupations";

/**
 * Привязка occupation_term → collective_agreement_id, детерминированная
 * (см. Occupation.agreementCode) — общая для JobTech и NAV импортёров.
 */
export async function resolveAgreementIds(
  supabase: SupabaseClient,
  country: string,
  occupationTerms: string[]
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
    .in("code", codes);
  for (const a of data ?? []) idByCode.set(a.code, a.id);
  return idByCode;
}

export function collectiveAgreementIdFor(
  idByCode: Map<string, string>,
  occupationTerm: string
): string | null {
  const code = agreementCodeForTerm(occupationTerm);
  return code ? (idByCode.get(code) ?? null) : null;
}
