import { decode } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { authSecret } from "@/lib/env";

/**
 * Middleware hanya MEMBACA token sesi, tidak pernah menulis cookie. Middleware bawaan Auth.js menulis ulang
 * cookie sesi pada setiap respons, sehingga prefetch yang masih berjalan saat pengguna menekan Keluar dapat
 * menghidupkan kembali sesi yang baru dihapus. Halaman (requireUser) dan API tetap memeriksa sesi sendiri.
 */
const PUBLIC = ["/masuk", "/api/auth", "/api/cron", "/manifest", "/sw.js", "/offline", "/brand", "/icons"];
const COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"];

async function hasSession(req: NextRequest, secret: string) {
  for (const name of COOKIES) {
    const token = req.cookies.get(name)?.value;
    if (!token) continue;
    try {
      const payload = await decode({ token, secret, salt: name });
      if (payload) return true;
    } catch {
      // token rusak atau kedaluwarsa: anggap tidak bersesi
    }
  }
  return false;
}

export default async function middleware(req: NextRequest) {
  const secret = authSecret();
  // Tanpa AUTH_SECRET, biarkan halaman /masuk menampilkan daftar periksa konfigurasi
  if (!secret) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname === "/" || PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (await hasSession(req, secret)) return NextResponse.next();
  const url = new URL("/masuk", req.nextUrl.origin);
  url.searchParams.set("callbackUrl", req.nextUrl.href);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|brand|sw.js|manifest.webmanifest|offline.html).*)"],
};
