import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { deliver } from "@/lib/push";
import { getTr } from "@/lib/i18n-server";

export const runtime = "nodejs";

// Notifikasi uji ke seluruh perangkat milik pengguna yang sedang masuk, dalam bahasa yang sedang dipakainya
export async function POST() {
  const { tr } = await getTr();
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return NextResponse.json({ error: tr("Belum masuk.", "You are not signed in.") }, { status: 401 });
  const subs = await db.pushSubscription.findMany({ where: { userId: session.user.id }, select: { id: true, endpoint: true, p256dh: true, auth: true } });
  if (!subs.length) return NextResponse.json({ error: tr("Belum ada perangkat yang terdaftar.", "No devices are registered yet.") }, { status: 400 });
  const r = await deliver(subs, {
    title: tr("Notifikasi PEDULI aktif", "PEDULI notifications are active"),
    body: tr("Perangkat ini akan menerima notifikasi tugas dan tindak lanjut.", "This device will receive notifications for tasks and follow-ups."),
    url: "/notifikasi",
    type: "UJI",
  });
  return NextResponse.json({ ok: r.sent > 0, ...r });
}
