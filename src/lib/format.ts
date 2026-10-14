const TZ = "Asia/Jakarta";

export function fmtDateTime(d: Date | string | null | undefined, withSeconds = false) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return (
    new Intl.DateTimeFormat("id-ID", {
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

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function fmtMonth(d: Date) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: TZ, month: "short", year: "2-digit" }).format(d);
}

export function fmtMonthLong(d: Date) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: TZ, month: "long", year: "numeric" }).format(d);
}

export function fmtNumber(n: number, digits = 0) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n);
}

export function fmtPct(n: number, digits = 0) {
  return `${fmtNumber(n, digits)}%`;
}

export function relTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} hari lalu`;
  return fmtDate(date);
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
