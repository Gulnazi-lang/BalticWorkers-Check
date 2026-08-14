import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/alerts/status?state=error", request.url));
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("job_alerts")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("confirm_token", token)
    .is("confirmed_at", null)
    .select("id")
    .maybeSingle();

  if (!data) {
    return NextResponse.redirect(new URL("/alerts/status?state=error", request.url));
  }

  return NextResponse.redirect(new URL("/alerts/status?state=confirmed", request.url));
}
