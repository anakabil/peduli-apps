import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getVapid } from "@/lib/push";
import { getTr } from "@/lib/i18n-server";

export const runtime = "nodejs";

// Kunci publik VAPID untuk mendaftarkan perangkat ke notifikasi ponsel
export async function GET() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) {
    const { tr } = await getTr();
    return NextResponse.json({ error: tr("Belum masuk.", "You are not signed in.") }, { status: 401 });
  }
  const { publicKey } = await getVapid();
  return NextResponse.json({ publicKey });
}
