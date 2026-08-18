import { NextResponse } from "next/server";
import { getImportHealth } from "@/lib/importers/importHealth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

// Публичный, но намеренно минимальный endpoint: только свежесть последнего
// успешного JobTech-импорта. Он не запускает импорт и не отдаёт вакансии.
export async function GET() {
  try {
    const health = await getImportHealth(createServiceClient(), "jobtech");
    return NextResponse.json(health, {
      status: health.fresh ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`[import:health] ${message}`);
    return NextResponse.json({ error: "import health unavailable" }, { status: 503 });
  }
}
