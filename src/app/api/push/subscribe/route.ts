import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const sub = z.object({
  endpoint: z.string().url().max(2000).refine((u) => u.startsWith("https://"), "Endpoint harus HTTPS"),
  keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }),
});

async function activeUser() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return null;
  return db.user.findFirst({ where: { id: session.user.id, status: "ACTIVE" }, select: { id: true } });
}

// Mendaftarkan perangkat ini untuk pengguna yang sedang masuk. Perangkat yang sama berpindah ke akun yang terakhir masuk.
export async function POST(req: Request) {
  const user = await activeUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const parsed = sub.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data langganan tidak valid." }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null;
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
  });
  return NextResponse.json({ ok: true });
}

// Melepas perangkat ini dari notifikasi ponsel
export async function DELETE(req: Request) {
  const user = await activeUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) return NextResponse.json({ error: "Endpoint wajib." }, { status: 400 });
  await db.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId: user.id } });
  return NextResponse.json({ ok: true });
}
