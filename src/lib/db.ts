import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Memilih URL koneksi runtime. Integrasi Prisma Postgres di Vercel dapat menyuntikkan
 * PRISMA_DATABASE_URL (prisma+postgres://, lewat pooler) dan/atau DATABASE_URL (postgres://).
 * Urutan: URL pooler lebih dahulu karena paling aman untuk serverless.
 */
export function resolveDatabaseUrl() {
  const candidates = [process.env.PRISMA_DATABASE_URL, process.env.DATABASE_URL, process.env.POSTGRES_PRISMA_URL, process.env.POSTGRES_URL];
  const url = candidates.find((u) => !!u && u.trim().length > 0);
  if (!url) throw new Error("DATABASE_URL belum diatur. Lihat README bagian Produksi.");
  return url;
}

function createClient() {
  return new PrismaClient({ datasourceUrl: resolveDatabaseUrl(), log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
}

export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
