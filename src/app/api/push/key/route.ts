import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getVapid } from "@/lib/push";

export const runtime = "nodejs";

// Kunci publik VAPID untuk mendaftarkan perangkat ke notifikasi ponsel
export async function GET() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const { publicKey } = await getVapid();
  return NextResponse.json({ publicKey });
}
