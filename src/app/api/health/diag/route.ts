import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

// SEMENTARA: diagnosa latensi basis data (pooler vs koneksi langsung). Dihapus setelah investigasi.
const TOKEN = "b9ffd9f2cdaff014e40dd0db";

async function probe(url: string) {
  const out: number[] = [];
  const c = new PrismaClient({ datasourceUrl: url });
  try {
    for (let i = 0; i < 3; i++) {
      const t = Date.now();
      await c.$queryRaw`SELECT 1`;
      out.push(Date.now() - t);
    }
    return { ok: true, ms: out };
  } catch (e) {
    return { ok: false, ms: out, err: String((e as Error).message).slice(0, 160) };
  } finally {
    await c.$disconnect().catch(() => {});
  }
}

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("t") !== TOKEN) return NextResponse.json({ error: "not found" }, { status: 404 });
  const base = env("PRISMA_DATABASE_URL") || env("DATABASE_URL");
  const u = new URL(base);
  const host = u.hostname;
  const pooled = new URL(base); pooled.hostname = "pooled.db.prisma.io"; pooled.searchParams.set("pgbouncer", "true"); pooled.searchParams.set("connection_limit", "1");
  const direct = new URL(base); direct.searchParams.set("connection_limit", "1");
  const p1 = await probe(pooled.toString());
  const d1 = await probe(direct.toString());
  return NextResponse.json({ region: process.env.VERCEL_REGION ?? null, host, params: [...u.searchParams.keys()], pooled: p1, direct: d1 }, { headers: { "Cache-Control": "no-store" } });
}
