import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

async function unsubscribe(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return false;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("job_alerts")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("id")
    .maybeSingle();

  return Boolean(data);
}

export async function GET(request: NextRequest) {
  const success = await unsubscribe(request);
  return NextResponse.redirect(
    new URL(`/alerts/status?state=${success ? "unsubscribed" : "error"}`, request.url)
  );
}

// RFC 8058: почтовый клиент может показать собственную кнопку «Отписаться»
// и отправить POST без открытия страницы в браузере.
export async function POST(request: NextRequest) {
  const success = await unsubscribe(request);
  return new NextResponse(null, { status: success ? 204 : 400 });
}
