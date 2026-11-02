import { NextResponse, type NextRequest } from "next/server";
import { authConfigured, SESSION_COOKIE, verifySession } from "@/lib/auth";

/**
 * Paneli korur. WhatsApp webhook'u ve giriş sayfası herkese açık kalmalı
 * (Meta'nın sunucuları webhook'a oturumsuz erişir).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lokal geliştirmede şifre tanımlı değilse paneli serbest bırak
  if (!authConfigured() && process.env.NODE_ENV !== "production") return NextResponse.next();

  const ok = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/giris";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api/webhooks|api/integrations|api/auth|giris|_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt).*)"],
};
