/*
 * Menjalankan `prisma migrate deploy` dengan URL koneksi langsung (TCP) bila tersedia.
 * Migrasi memerlukan koneksi langsung, bukan pooler. Dipakai saat build di Vercel dan secara lokal.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";

// Muat .env lokal bila ada (di Vercel variabel sudah tersedia di lingkungan)
for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const names = ["DIRECT_URL", "DIRECT_DATABASE_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "PRISMA_DATABASE_URL"];
const present = names.filter((n) => process.env[n] && process.env[n].trim());
if (!present.length) {
  console.error("Tidak ada variabel koneksi basis data. Atur DATABASE_URL (lihat README).");
  process.exit(1);
}
const direct = present.find((n) => /^postgres(ql)?:\/\//.test(process.env[n]));
const chosen = direct ?? present[0];
console.log(`[migrate] memakai ${chosen}${direct ? " (koneksi langsung)" : " (tanpa koneksi langsung, mencoba URL yang ada)"}`);
if (process.env.SKIP_MIGRATE === "true") {
  console.log("[migrate] SKIP_MIGRATE=true, migrasi dilewati.");
  process.exit(0);
}
const r = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env: { ...process.env, DATABASE_URL: process.env[chosen] }, shell: process.platform === "win32" });
process.exit(r.status ?? 1);
