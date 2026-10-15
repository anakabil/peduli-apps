import { PrismaClient } from "@prisma/client";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Memilih URL koneksi runtime. Integrasi Prisma Postgres di Vercel dapat menyuntikkan
 * PRISMA_DATABASE_URL (prisma+postgres://, lewat pooler) dan/atau DATABASE_URL (postgres://).
 * Urutan: URL pooler lebih dahulu karena paling aman untuk serverless.
 */
export function resolveDatabaseUrl() {
  const candidates = ["PRISMA_DATABASE_URL", "DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"].map(env);
  const url = candidates.find((u) => u.length > 0);
  if (!url) throw new Error("DATABASE_URL belum diatur. Lihat README bagian Produksi.");
  return url;
}

function createClient() {
  return new PrismaClient({ datasourceUrl: resolveDatabaseUrl(), log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
}

export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
