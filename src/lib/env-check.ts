/** Pemeriksaan konfigurasi lingkungan untuk menampilkan daftar periksa alih-alih galat 500. */
export type EnvIssue = { key: string; level: "wajib" | "peringatan"; message: string };

export function hasDatabaseUrl() {
  return [process.env.PRISMA_DATABASE_URL, process.env.DATABASE_URL, process.env.POSTGRES_PRISMA_URL, process.env.POSTGRES_URL].some((u) => !!u && u.trim().length > 0);
}

export function envIssues(): EnvIssue[] {
  const issues: EnvIssue[] = [];
  if (!process.env.AUTH_SECRET) issues.push({ key: "AUTH_SECRET", level: "wajib", message: "Rahasia sesi belum diatur. Buat dengan `openssl rand -base64 32` lalu simpan di Vercel sebagai AUTH_SECRET." });
  if (!hasDatabaseUrl()) issues.push({ key: "DATABASE_URL", level: "wajib", message: "URL basis data belum diatur. Pasang integrasi Prisma Postgres di Vercel (menyuntikkan DATABASE_URL) atau isi manual." });
  const google = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;
  const demo = process.env.DEMO_MODE === "true";
  if (!google && !demo) issues.push({ key: "AUTH_GOOGLE_ID", level: "wajib", message: "Tidak ada cara masuk: isi AUTH_GOOGLE_ID dan AUTH_GOOGLE_SECRET (Google OAuth), atau aktifkan DEMO_MODE=true untuk uji coba." });
  if (google && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) issues.push({ key: "NEXT_PUBLIC_GOOGLE_CLIENT_ID", level: "peringatan", message: "Google One Tap di smartphone memerlukan NEXT_PUBLIC_GOOGLE_CLIENT_ID (nilai sama dengan AUTH_GOOGLE_ID)." });
  if (!process.env.ADMIN_EMAILS) issues.push({ key: "ADMIN_EMAILS", level: "peringatan", message: "Tanpa ADMIN_EMAILS, tidak ada akun yang otomatis menjadi Admin saat pertama masuk." });
  if (demo && process.env.NODE_ENV === "production") issues.push({ key: "DEMO_MODE", level: "peringatan", message: "DEMO_MODE aktif di produksi: siapa pun dapat masuk sebagai akun contoh. Matikan setelah uji coba." });
  if (!process.env.CRON_SECRET) issues.push({ key: "CRON_SECRET", level: "peringatan", message: "Tanpa CRON_SECRET, endpoint pengingat dapat dipanggil siapa saja (hanya mengirim notifikasi internal)." });
  return issues;
}

export function envBlocking() {
  return envIssues().filter((i) => i.level === "wajib");
}
