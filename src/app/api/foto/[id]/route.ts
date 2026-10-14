import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reportScope } from "@/lib/workflow";

export const runtime = "nodejs";
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, areaId: true, status: true } });
  if (!user || user.status !== "ACTIVE") return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  // Hanya foto dari laporan dalam lingkup akses pengguna
  const photo = await db.photo.findFirst({ where: { id, report: reportScope(user) } });
  if (!photo) return new NextResponse("Not found", { status: 404 });
  const mime = ALLOWED.has(photo.mime) ? photo.mime : "application/octet-stream";
  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=300, must-revalidate",
      "Content-Length": String(photo.size),
    },
  });
}
