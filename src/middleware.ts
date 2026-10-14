import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Tanpa AUTH_SECRET, Auth.js akan gagal di setiap permintaan. Biarkan halaman /masuk menampilkan daftar periksa konfigurasi.
const handler = process.env.AUTH_SECRET ? NextAuth(authConfig).auth : () => NextResponse.next();

export default handler;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|brand|sw.js|manifest.webmanifest|offline.html).*)"],
};
