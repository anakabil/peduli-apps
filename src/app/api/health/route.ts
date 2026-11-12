import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Pemeriksaan kesehatan untuk pemantauan: apakah aplikasi dapat menjangkau basis data. Tanpa data pengguna. */
export async function GET() {
  const t = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "ok", ms: Date.now() - t }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, db: "error", ms: Date.now() - t }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
