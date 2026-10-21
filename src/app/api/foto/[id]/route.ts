import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reportScope } from "@/lib/workflow";

export const runtime = "nodejs";
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, areaId: true, status: true } });
  if (!user || user.status !== "ACTIVE") return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  // Hanya foto dari laporan dalam lingkup akses pengguna
  // ?ukuran=kecil: hanya gambar kecil yang dibaca dari basis data agar daftar laporan ringan
  const small = new URL(req.url).searchParams.get("ukuran") === "kecil";
  const photo = await db.photo.findFirst({ where: { id, report: reportScope(user) }, select: { mime: true, thumb: small, data: !small } });
  if (!photo) return new NextResponse("Not found", { status: 404 });
  let body = small ? photo.thumb : photo.data;
  let mime = small && photo.thumb ? "image/jpeg" : ALLOWED.has(photo.mime) ? photo.mime : "application/octet-stream";
  if (!body) {
    // Foto lama tanpa gambar kecil: kirim foto asli
    const full = await db.photo.findUnique({ where: { id }, select: { data: true } });
    if (!full) return new NextResponse("Not found", { status: 404 });
    body = full.data;
    mime = ALLOWED.has(photo.mime) ? photo.mime : "application/octet-stream";
  }
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=604800, immutable",
      "Content-Length": String(body.length),
    },
  });
}
