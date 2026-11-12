import webpush from "web-push";
import { db } from "./db";
import { getSettings } from "./settings";
import type { NotifType } from "./constants";
import { pick, type Bi } from "./i18n";

/**
 * Notifikasi ponsel melalui Web Push (VAPID).
 * Kunci VAPID diambil dari VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY bila diatur; bila tidak, dibuat sekali
 * dan disimpan di tabel Setting agar fitur langsung berfungsi tanpa konfigurasi tambahan.
 */
type Vapid = { publicKey: string; privateKey: string };
const KEY = "vapid";
let cached: Vapid | null = null;

export async function getVapid(): Promise<Vapid> {
  if (cached) return cached;
  const envPub = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPriv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (envPub && envPriv) return (cached = { publicKey: envPub, privateKey: envPriv });
  const row = await db.setting.findUnique({ where: { key: KEY } });
  if (row) return (cached = JSON.parse(row.value) as Vapid);
  const keys = webpush.generateVAPIDKeys();
  try {
    await db.setting.create({ data: { key: KEY, value: JSON.stringify(keys) } });
    return (cached = keys);
  } catch {
    // Dibuat bersamaan oleh permintaan lain: pakai yang sudah tersimpan
    const again = await db.setting.findUniqueOrThrow({ where: { key: KEY } });
    return (cached = JSON.parse(again.value) as Vapid);
  }
}

/** Subjek VAPID: alamat aplikasi, tanpa alamat email pribadi */
function subject() {
  if (process.env.VAPID_SUBJECT) return process.env.VAPID_SUBJECT;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const url = process.env.AUTH_URL ?? "";
  return url.startsWith("https://") ? url : "mailto:notifikasi@peduli.local";
}

export type PushPayload = { title: string; body?: string | null; url?: string | null; type?: NotifType | "UJI" };

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

/** Mengirim ke daftar langganan; langganan yang sudah tidak berlaku (404/410) dihapus. */
export async function deliver(subs: Sub[], payload: PushPayload) {
  if (!subs.length) return { sent: 0, failed: 0 };
  const vapid = await getVapid();
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url || "/notifikasi",
    // Notifikasi untuk laporan yang sama saling menggantikan, yang berbeda tetap terpisah
    tag: payload.url || payload.type || "peduli",
  });
  const urgent = payload.type === "ESKALASI" || payload.type === "TUGAS_VERIFIKASI" || payload.type === "TUGAS_KEPUTUSAN" || payload.type === "PENUGASAN";
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
        vapidDetails: { subject: subject(), publicKey: vapid.publicKey, privateKey: vapid.privateKey },
        TTL: 60 * 60 * 24,
        urgency: urgent ? "high" : "normal",
        timeout: 8000,
      }),
    ),
  );
  const gone: string[] = [];
  let sent = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") sent++;
    else {
      const code = (r.reason as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) gone.push(subs[i].id);
      else console.error("Gagal mengirim notifikasi ponsel", code ?? r.reason);
    }
  });
  if (gone.length) await db.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  return { sent, failed: results.length - sent };
}

/** Notifikasi ponsel sesuai pengaturan program, pilihan masing-masing pengguna, dan bahasanya */
export async function sendPush(type: NotifType, userIds: string[], payload: { title: Bi; body?: Bi | null; url?: string | null }) {
  if (!userIds.length) return;
  const settings = await getSettings();
  if (!settings.push[type]) return;
  const subs = await db.pushSubscription.findMany({
    where: { userId: { in: userIds }, user: { status: "ACTIVE", NOT: { pushMuted: { has: type } } } },
    select: { id: true, endpoint: true, p256dh: true, auth: true, user: { select: { lang: true } } },
  });
  for (const lang of ["id", "en"] as const) {
    const group = subs.filter((s) => (s.user.lang === "en" ? "en" : "id") === lang);
    if (group.length) await deliver(group, { title: pick(payload.title, lang)!, body: pick(payload.body, lang), url: payload.url, type });
  }
}
