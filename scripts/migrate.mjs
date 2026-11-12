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
// Basis data terkelola kadang menolak sementara ("too many connections"); coba ulang dengan jeda bertahap
const TRANSIENT = /too many connections|P1001|P1017|ECONNRESET|ETIMEDOUT|Connection terminated|timed out/i;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
for (let attempt = 1; ; attempt++) {
  const r = spawnSync("npx", ["prisma", "migrate", "deploy"], { encoding: "utf8", env: { ...process.env, DATABASE_URL: process.env[chosen] }, shell: process.platform === "win32" });
  process.stdout.write(r.stdout ?? "");
  process.stderr.write(r.stderr ?? "");
  if (r.status === 0) process.exit(0);
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  if (attempt >= 5 || !TRANSIENT.test(out)) process.exit(r.status ?? 1);
  const wait = attempt * 10;
  console.log(`[migrate] gangguan koneksi sementara, mencoba lagi dalam ${wait} detik (percobaan ${attempt + 1} dari 5)`);
  sleep(wait * 1000);
}
