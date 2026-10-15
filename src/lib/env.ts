/**
 * Pembaca variabel lingkungan yang toleran terhadap kesalahan tempel umum di dasbor hosting:
 * spasi di awal/akhir dan tanda kutip pembungkus ("..." atau '...') ikut tersalin dari contoh .env.
 * Aman dipakai di middleware (tanpa dependensi Node).
 */
export function env(name: string): string {
  const raw = process.env[name];
  if (raw == null) return "";
  let v = raw.trim();
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) v = v.slice(1, -1).trim();
  return v;
}

export function envBool(name: string) {
  return ["true", "1", "yes", "ya", "on"].includes(env(name).toLowerCase());
}

export function envList(name: string) {
  return env(name)
    .split(/[,;\s]+/)
    .map((s) => s.trim().replace(/^["']|["']$/g, "").toLowerCase())
    .filter(Boolean);
}

/** Rahasia sesi Auth.js; menerima nama lama NEXTAUTH_SECRET */
export function authSecret() {
  return env("AUTH_SECRET") || env("NEXTAUTH_SECRET");
}

export function googleClientId() {
  return env("AUTH_GOOGLE_ID") || env("GOOGLE_CLIENT_ID");
}
export function googleClientSecret() {
  return env("AUTH_GOOGLE_SECRET") || env("GOOGLE_CLIENT_SECRET");
}
export function oneTapClientId() {
  return env("NEXT_PUBLIC_GOOGLE_CLIENT_ID") || googleClientId();
}
