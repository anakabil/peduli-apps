import type { Lang } from "./i18n";

const TZ = "Asia/Jakarta";
const loc = (lang: Lang = "id") => (lang === "en" ? "en-GB" : "id-ID");

export function fmtDateTime(d: Date | string | null | undefined, withSeconds = false, lang: Lang = "id") {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return (
    new Intl.DateTimeFormat(loc(lang), {
      timeZone: TZ,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: withSeconds ? "2-digit" : undefined,
      hour12: false,
    }).format(date) + " WIB"
  );
}

export function fmtDate(d: Date | string | null | undefined, lang: Lang = "id") {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function fmtMonth(d: Date, lang: Lang = "id") {
  return new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, month: "short", year: "2-digit" }).format(d);
}

export function fmtMonthLong(d: Date, lang: Lang = "id") {
  return new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, month: "long", year: "numeric" }).format(d);
}

export function fmtNumber(n: number, digits = 0, lang: Lang = "id") {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "id-ID", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n);
}

export function fmtPct(n: number, digits = 0, lang: Lang = "id") {
  return `${fmtNumber(n, digits, lang)}%`;
}

export function relTime(d: Date | string, lang: Lang = "id") {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = (Date.now() - date.getTime()) / 1000;
  const en = lang === "en";
  const n = (v: number, id: string, enUnit: string) => (en ? `${v} ${enUnit}${v === 1 ? "" : "s"} ago` : `${v} ${id} lalu`);
  if (diff < 60) return en ? "just now" : "baru saja";
  if (diff < 3600) return n(Math.floor(diff / 60), "menit", "minute");
  if (diff < 86400) return n(Math.floor(diff / 3600), "jam", "hour");
  if (diff < 86400 * 30) return n(Math.floor(diff / 86400), "hari", "day");
  return fmtDate(date, lang);
}

export function daysBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 86400000;
}

export function hoursBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 3600000;
}

const JKT_OFFSET_MS = 7 * 3600000;

/** Komponen tanggal menurut zona Asia/Jakarta (WIB, UTC+7, tanpa DST) */
export function jktParts(d: Date = new Date()) {
  const s = new Date(d.getTime() + JKT_OFFSET_MS);
  return { y: s.getUTCFullYear(), m0: s.getUTCMonth(), d: s.getUTCDate(), dow: s.getUTCDay(), h: s.getUTCHours() };
}

/** Date yang mewakili tengah malam WIB pada tanggal yang diberikan (bulan 0-11, boleh di luar rentang) */
export function jktDate(y: number, m0: number, d = 1) {
  return new Date(Date.UTC(y, m0, d) - JKT_OFFSET_MS);
}

/** Tambah n hari kerja (Senin-Jumat) menurut kalender WIB */
export function addBusinessDays(from: Date, days: number) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setTime(d.getTime() + 86400000);
    const dow = jktParts(d).dow;
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Jarak haversine dalam meter */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
