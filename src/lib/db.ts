import { PrismaClient } from "@prisma/client";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const CANDIDATES = ["PRISMA_DATABASE_URL", "DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];
const isAccelerate = (u: string) => /^prisma(\+postgres)?:\/\//.test(u);

/**
 * Prisma Postgres memisahkan host koneksi langsung (db.prisma.io) dan pooler PgBouncer (pooled.db.prisma.io).
 * Koneksi langsung sangat terbatas (paket Free: 10, lima di antaranya dipakai platform) dan hanya untuk migrasi;
 * lalu lintas aplikasi wajib lewat pooler. Kredensial sama, hanya host yang berbeda.
 * Pooler berjalan dalam mode transaksi, jadi Prisma perlu pgbouncer=true (tanpa prepared statement).
 */
function toRuntimeUrl(url: string) {
  try {
    const u = new URL(url);
    const pooled = u.hostname === "db.prisma.io" && process.env.DB_POOLED !== "false";
    if (pooled) {
      u.hostname = "pooled.db.prisma.io";
      if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    }
    // Setiap instans fungsi serverless membuka kolamnya sendiri; jaga agar kecil
    if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", pooled ? "2" : "3");
    if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "20");
    return { url: u.toString(), mode: pooled ? "pooler PgBouncer" : "koneksi langsung", host: u.host };
  } catch {
    return { url, mode: "tidak dikenali", host: "" };
  }
}

/**
 * Memilih URL koneksi runtime. URL Accelerate (prisma+postgres://) dipakai apa adanya bila ada;
 * URL postgres:// Prisma Postgres dialihkan ke host pooler. Lokal (bukan produksi) tidak diubah.
 */
export function resolveDatabaseUrl() {
  const found = CANDIDATES.map((name) => ({ name, url: env(name) })).filter((c) => c.url.length > 0);
  if (!found.length) throw new Error("DATABASE_URL belum diatur. Lihat README bagian Produksi.");
  const accel = found.find((c) => isAccelerate(c.url));
  const chosen = accel ?? found[0];
  const serverless = !!process.env.VERCEL || process.env.NODE_ENV === "production";
  if (accel || !serverless) return chosen.url;
  const r = toRuntimeUrl(chosen.url);
  // Hanya nama variabel, mode, dan host; tanpa kredensial
  console.info(`[db] ${chosen.name} ${r.mode} ${r.host}`);
  return r.url;
}

function createClient() {
  return new PrismaClient({ datasourceUrl: resolveDatabaseUrl(), log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
}

export const db = globalForPrisma.prisma ?? createClient();
// Satu klien per proses, juga di produksi, agar potongan kode server tidak membuka kolam koneksi sendiri-sendiri
globalForPrisma.prisma = db;
