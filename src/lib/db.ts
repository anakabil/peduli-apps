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
    // Satu instans Vercel (Fluid compute) melayani banyak permintaan sekaligus dan tiap halaman menjalankan
    // beberapa kueri paralel; kolam 2 koneksi membuat antrean hingga batas tunggu (P2024). Kolam 4 per instans
    // tetap di bawah kuota pooler paket Free (10) untuk dua instans, dan koneksi menganggur dilepas setelah
    // 60 detik agar instans lama tidak menahan kuota. Batas tunggu 10 detik agar kegagalan tidak menggantung.
    const set = (k: string, v: string) => !u.searchParams.has(k) && u.searchParams.set(k, v);
    set("connection_limit", pooled ? "4" : "3");
    set("pool_timeout", "10");
    set("connect_timeout", "10");
    set("max_idle_connection_lifetime", "60");
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
