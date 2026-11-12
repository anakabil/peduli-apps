import { after } from "next/server";
import { db } from "./db";
import { sendPush } from "./push";
import type { NotifType } from "./constants";
import type { Bi } from "./i18n";

const asBi = (v: string | Bi | null | undefined): Bi | null => (v == null ? null : typeof v === "string" ? { id: v, en: v } : v);

/**
 * Mengirim notifikasi dalam aplikasi dan, sesuai pengaturan, notifikasi ke ponsel; mengembalikan jumlah penerima.
 * Judul dan isi dapat dwibahasa, bi("Teks", "Text"); penerima melihatnya sesuai bahasa yang dipilihnya.
 * Notifikasi ponsel dikirim setelah respons selesai agar pengguna tidak menunggu.
 */
export async function notify(type: NotifType, userIds: Array<string | null | undefined>, title: string | Bi, body?: string | Bi | null, link?: string) {
  const ids = Array.from(new Set(userIds.filter((x): x is string => !!x)));
  if (!ids.length) return 0;
  const t = asBi(title)!;
  const b = asBi(body);
  await db.notification.createMany({ data: ids.map((userId) => ({ userId, type, title: t.id, titleEn: t.en, body: b?.id ?? null, bodyEn: b?.en ?? null, link })) });
  const job = () => sendPush(type, ids, { title: t, body: b, url: link }).catch((e) => console.error("Notifikasi ponsel gagal", e));
  try {
    after(job);
  } catch {
    // Di luar siklus permintaan (mis. skrip): kirim langsung
    await job();
  }
  return ids.length;
}

export async function audit(actorId: string | null, action: string, entity?: string, entityId?: string, detail?: unknown) {
  await db.auditLog.create({
    data: { actorId, action, entity, entityId, detail: detail === undefined ? null : JSON.stringify(detail) },
  });
}
