/** Pemeriksaan konfigurasi lingkungan untuk menampilkan daftar periksa alih-alih galat 500. */
import { env, envBool, authSecret, googleClientId, googleClientSecret } from "./env";

export type EnvIssue = { key: string; level: "wajib" | "peringatan"; message: string };

const DB_VARS = ["PRISMA_DATABASE_URL", "DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];

export function hasDatabaseUrl() {
  return DB_VARS.some((n) => env(n).length > 0);
}

function quoted(name: string) {
  const raw = (process.env[name] ?? "").trim();
  return raw.length >= 2 && /^["'].*["']$/.test(raw);
}

export function envIssues(): EnvIssue[] {
  const issues: EnvIssue[] = [];
  if (!authSecret()) issues.push({ key: "AUTH_SECRET", level: "wajib", message: "Rahasia sesi belum diatur. Isi dengan string acak minimal 32 karakter, lalu deploy ulang." });
  else if (authSecret().length < 32) issues.push({ key: "AUTH_SECRET", level: "peringatan", message: "AUTH_SECRET terlalu pendek. Gunakan minimal 32 karakter acak." });
  if (!hasDatabaseUrl()) issues.push({ key: "DATABASE_URL", level: "wajib", message: "URL basis data belum diatur. Pasang integrasi Prisma Postgres di Vercel (menyuntikkan DATABASE_URL) atau isi manual." });
  const google = !!googleClientId() && !!googleClientSecret();
  const demo = envBool("DEMO_MODE");
  if (!google && !demo) {
    if (googleClientId() && !googleClientSecret()) issues.push({ key: "AUTH_GOOGLE_SECRET", level: "wajib", message: "AUTH_GOOGLE_ID sudah ada, tetapi AUTH_GOOGLE_SECRET belum. Keduanya wajib untuk masuk dengan Google." });
    else if (!googleClientId() && googleClientSecret()) issues.push({ key: "AUTH_GOOGLE_ID", level: "wajib", message: "AUTH_GOOGLE_SECRET sudah ada, tetapi AUTH_GOOGLE_ID belum. Keduanya wajib untuk masuk dengan Google." });
    else issues.push({ key: "AUTH_GOOGLE_ID", level: "wajib", message: "Tidak ada cara masuk: isi AUTH_GOOGLE_ID dan AUTH_GOOGLE_SECRET (Google OAuth), atau isi DEMO_MODE dengan true untuk uji coba." });
  }
  if (google && !env("NEXT_PUBLIC_GOOGLE_CLIENT_ID")) issues.push({ key: "NEXT_PUBLIC_GOOGLE_CLIENT_ID", level: "peringatan", message: "Google One Tap di smartphone memerlukan NEXT_PUBLIC_GOOGLE_CLIENT_ID (nilai sama dengan AUTH_GOOGLE_ID)." });
  if (!env("ADMIN_EMAILS")) issues.push({ key: "ADMIN_EMAILS", level: "peringatan", message: "Tanpa ADMIN_EMAILS, tidak ada akun yang otomatis menjadi Admin saat pertama masuk." });
  if (demo && env("VERCEL_ENV") === "production") issues.push({ key: "DEMO_MODE", level: "peringatan", message: "DEMO_MODE aktif di produksi: siapa pun dapat masuk sebagai akun contoh. Matikan setelah uji coba." });
  if (!env("CRON_SECRET")) issues.push({ key: "CRON_SECRET", level: "peringatan", message: "Tanpa CRON_SECRET, pengingat otomatis harian tidak berjalan." });
  return issues;
}

export function envBlocking() {
  return envIssues().filter((i) => i.level === "wajib");
}

export type EnvDiagnostics = {
  environment: string;
  commit: string | null;
  branch: string | null;
  host: string | null;
  variables: Array<{ name: string; present: boolean; quoted: boolean }>;
};

const APP_VARS = ["AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "NEXT_PUBLIC_GOOGLE_CLIENT_ID", "ADMIN_EMAILS", "ALLOWED_EMAIL_DOMAINS", "DEMO_MODE", "CRON_SECRET", ...DB_VARS];

/** Hanya nama dan status keberadaan variabel; nilai tidak pernah ditampilkan */
export function envDiagnostics(): EnvDiagnostics {
  return {
    environment: env("VERCEL_ENV") || process.env.NODE_ENV || "-",
    commit: env("VERCEL_GIT_COMMIT_SHA") ? env("VERCEL_GIT_COMMIT_SHA").slice(0, 7) : null,
    branch: env("VERCEL_GIT_COMMIT_REF") || null,
    host: env("VERCEL_URL") || null,
    variables: APP_VARS.map((name) => ({ name, present: env(name).length > 0, quoted: quoted(name) })),
  };
}
