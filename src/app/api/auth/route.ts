import { NextResponse } from "next/server";
import { checkPassword, createSession, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";

// Basit kaba-kuvvet koruması (instance başına). Tek kullanıcılı panel için yeterli.
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rec = attempts.get(ip);
  if (rec && rec.until > Date.now()) {
    return NextResponse.json({ error: "Çok fazla hatalı deneme. 10 dakika sonra tekrar deneyin." }, { status: 429 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Sunucuda ADMIN_PASSWORD tanımlı değil. Vercel ortam değişkenlerine ekleyin." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";

  if (!(await checkPassword(password))) {
    const count = (rec?.count ?? 0) + 1;
    attempts.set(ip, { count, until: count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0 });
    return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
