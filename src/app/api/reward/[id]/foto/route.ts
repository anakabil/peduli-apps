import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

// Foto hadiah untuk pengguna yang sudah masuk. URL memuat ?v=<waktu unggah> sehingga aman di-cache lama.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const img = await db.rewardImage.findUnique({ where: { rewardId: id }, select: { mime: true, data: true } });
  if (!img) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(img.data), {
    headers: {
      "Content-Type": ALLOWED.has(img.mime) ? img.mime : "application/octet-stream",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=2592000, immutable",
      "Content-Length": String(img.data.length),
    },
  });
}
