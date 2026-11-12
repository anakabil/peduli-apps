import { PrismaClient } from "@prisma/client";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const CANDIDATES = ["PRISMA_DATABASE_URL", "DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];
const isPooled = (u: string) => /^prisma(\+postgres)?:\/\//.test(u);

/** Batas koneksi per instans fungsi serverless bila terpaksa memakai koneksi langsung */
function limitDirect(url: string) {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "3");
    if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "20");
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Memilih URL koneksi runtime.
 * Di Vercel setiap instans fungsi membuka kolam koneksinya sendiri, sehingga koneksi langsung (postgres://)
 * cepat habis ("too many connections") saat banyak instans aktif, misalnya ketika deploy atau lalu lintas naik.
 * Karena itu URL pooler Prisma Postgres (prisma+postgres:// atau prisma://) didahulukan dari variabel mana pun.
 * Bila hanya ada koneksi langsung, tiap instans dibatasi tiga koneksi.
 */
export function resolveDatabaseUrl() {
  const found = CANDIDATES.map((name) => ({ name, url: env(name) })).filter((c) => c.url.length > 0);
  if (!found.length) throw new Error("DATABASE_URL belum diatur. Lihat README bagian Produksi.");
  const pooled = found.find((c) => isPooled(c.url));
  const chosen = pooled ?? found[0];
  const serverless = !!process.env.VERCEL || process.env.NODE_ENV === "production";
  const url = pooled || !serverless ? chosen.url : limitDirect(chosen.url);
  if (serverless) {
    // Hanya nama variabel, skema, dan host; tanpa kredensial
    let host = "";
    try {
      host = new URL(chosen.url).host;
    } catch {}
    console.info(`[db] ${chosen.name} ${pooled ? "pooler" : "koneksi langsung, connection_limit=3"} ${host}`);
  }
  return url;
}

function createClient() {
  return new PrismaClient({ datasourceUrl: resolveDatabaseUrl(), log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
}

export const db = globalForPrisma.prisma ?? createClient();
// Satu klien per proses, juga di produksi, agar potongan kode server tidak membuka kolam koneksi sendiri-sendiri
globalForPrisma.prisma = db;
