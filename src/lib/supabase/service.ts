import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Клиент с сервисной ролью — обходит RLS. Только для серверного кода без
 * пользовательского контекста (импортёр, вебхуки). Никогда не импортировать
 * из кода, который может попасть в браузер: SUPABASE_SERVICE_ROLE_KEY без
 * префикса NEXT_PUBLIC_ и не должен им становиться.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY или NEXT_PUBLIC_SUPABASE_URL не заданы");
  }
  return createSupabaseClient(url, key);
}
