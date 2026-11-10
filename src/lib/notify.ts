import { after } from "next/server";
import { db } from "./db";
import { sendPush } from "./push";
import type { NotifType } from "./constants";

/**
 * Mengirim notifikasi dalam aplikasi dan, sesuai pengaturan, notifikasi ke ponsel; mengembalikan jumlah penerima.
 * Notifikasi ponsel dikirim setelah respons selesai agar pengguna tidak menunggu.
 */
export async function notify(type: NotifType, userIds: Array<string | null | undefined>, title: string, body?: string | null, link?: string) {
  const ids = Array.from(new Set(userIds.filter((x): x is string => !!x)));
  if (!ids.length) return 0;
  await db.notification.createMany({ data: ids.map((userId) => ({ userId, type, title, body: body ?? null, link })) });
  const job = () => sendPush(type, ids, { title, body, url: link }).catch((e) => console.error("Notifikasi ponsel gagal", e));
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
