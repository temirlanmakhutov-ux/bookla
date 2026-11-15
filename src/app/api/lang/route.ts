import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/locales";

// GET /api/lang?l=ru&next=/b/limon-kuafor — remembers the language and goes back.
export function GET(req: NextRequest) {
  const l = req.nextUrl.searchParams.get("l");
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const res = NextResponse.redirect(new URL(safeNext, req.url));
  if (isLocale(l)) {
    res.cookies.set(LOCALE_COOKIE, l, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return res;
}
