import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { deliver } from "@/lib/push";

export const runtime = "nodejs";

// Notifikasi uji ke seluruh perangkat milik pengguna yang sedang masuk
export async function POST() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const subs = await db.pushSubscription.findMany({ where: { userId: session.user.id }, select: { id: true, endpoint: true, p256dh: true, auth: true } });
  if (!subs.length) return NextResponse.json({ error: "Belum ada perangkat yang terdaftar." }, { status: 400 });
  const r = await deliver(subs, { title: "Notifikasi PEDULI aktif", body: "Perangkat ini akan menerima notifikasi tugas dan tindak lanjut.", url: "/notifikasi", type: "UJI" });
  return NextResponse.json({ ok: r.sent > 0, ...r });
}
