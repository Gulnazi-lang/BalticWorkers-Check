import type { SupabaseClient } from "@supabase/supabase-js";

export const IMPORT_HEALTH_MAX_AGE_HOURS = 30;

interface ImportRunRow {
  succeeded_at: string;
}

export async function recordSuccessfulImport(supabase: SupabaseClient, source: string): Promise<void> {
  const { error } = await supabase
    .from("import_runs")
    .upsert({ source, succeeded_at: new Date().toISOString() }, { onConflict: "source" });

  if (error) throw new Error(`import run record failed: ${error.message}`);
}

export async function getImportHealth(supabase: SupabaseClient, source: string) {
  const { data, error } = await supabase
    .from("import_runs")
    .select("succeeded_at")
    .eq("source", source)
    .maybeSingle();

  if (error) throw new Error(`import run health lookup failed: ${error.message}`);

  const lastSuccessAt = (data as ImportRunRow | null)?.succeeded_at ?? null;
  const ageMs = lastSuccessAt ? Date.now() - new Date(lastSuccessAt).getTime() : null;
  const fresh = ageMs !== null && ageMs <= IMPORT_HEALTH_MAX_AGE_HOURS * 60 * 60 * 1000;

  return { source, lastSuccessAt, maxAgeHours: IMPORT_HEALTH_MAX_AGE_HOURS, fresh };
}
