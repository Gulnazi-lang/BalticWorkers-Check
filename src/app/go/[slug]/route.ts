import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Только developer-контролируемые значения дают from= в наших же ссылках
// (см. src/app/services/page.tsx), но параметр всё равно приходит из URL —
// на всякий случай отбрасываем всё, что не похоже на имя страницы.
const SOURCE_PAGE_PATTERN = /^[a-z0-9-]{1,64}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const rawSource = request.nextUrl.searchParams.get("from");
  const sourcePage = rawSource && SOURCE_PAGE_PATTERN.test(rawSource) ? rawSource : null;

  const supabase = await createClient();
  const { data: partner } = await supabase
    .from("partners")
    .select("id, contact_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!partner) {
    redirect("/services");
  }

  await supabase.from("partner_clicks").insert({
    partner_id: partner.id,
    source_page: sourcePage,
  });

  redirect(partner.contact_url);
}
