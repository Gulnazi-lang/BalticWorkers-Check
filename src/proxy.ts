import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isEnabledLocale, isKnownLocale } from "@/i18n/config";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];
  // lt/et тоже пропускаем как есть (не превращаем "/lt" в "/lv/lt") — за
  // честный 404 для них отвечает notFound() в [locale]/layout.tsx.
  if (isKnownLocale(firstSegment)) {
    return NextResponse.next();
  }

  const locale = resolveLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

function resolveLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isEnabledLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(",")
      .map((part) => part.split(";")[0]?.trim().toLowerCase());
    for (const lang of preferred) {
      const base = lang?.split("-")[0];
      if (base && isEnabledLocale(base)) return base;
    }
  }

  return DEFAULT_LOCALE;
}

// matcher сам исключает /api, /go, /_next и файлы с расширением — они
// физически не доходят до proxy.
export const config = {
  matcher: ["/((?!api|go|_next|.*\\..*).*)"],
};
