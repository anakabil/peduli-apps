import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { notify } from "@/lib/notify";
import { env } from "@/lib/env";
import { verifiersFor, managersForArea } from "@/lib/workflow";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Pengingat otomatis bila melewati batas waktu. Dijalankan harian oleh penjadwal (Vercel Cron atau cron server):
 * GET /api/cron/pengingat dengan header Authorization: Bearer CRON_SECRET.
 * Penerima ditentukan dengan aturan yang sama seperti alur kerja dan hanya pengguna aktif.
 * Pengingat dicatat pada jejak laporan hanya bila ada penerima.
 */
export async function GET(req: Request) {
  const secret = env("CRON_SECRET");
  const authz = req.headers.get("authorization");
  if (!secret || authz !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized. Atur CRON_SECRET dan kirim header Authorization: Bearer <secret>." }, { status: 401 });
  const settings = await getSettings();
  if (!settings.reminders) return NextResponse.json({ ok: true, skipped: "pengingat nonaktif" });

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86400000);
  const reminded = new Set(
    (await db.reportEvent.findMany({ where: { type: "PENGINGAT", createdAt: { gte: dayAgo } }, select: { reportId: true } })).map((e) => e.reportId)
  );
  const activeIds = async (ids: Array<string | null>) => {
    const list = ids.filter((x): x is string => !!x);
    if (!list.length) return [];
    return (await db.user.findMany({ where: { id: { in: list }, status: "ACTIVE" }, select: { id: true } })).map((u) => u.id);
  };
  const stats = { sent: 0, unrouted: [] as string[] };
  const remind = async (reportId: string, number: string, targets: string[], title: string, body: string, note: string) => {
    const n = await notify(targets, title, body, `/laporan/${reportId}`);
    if (n === 0) {
      stats.unrouted.push(number);
      return;
    }
    await db.reportEvent.create({ data: { reportId, type: "PENGINGAT", note } });
    stats.sent++;
  };

  // Verifikasi lewat batas: penerima sama dengan yang berwenang memverifikasi
  const verify = await db.report.findMany({ where: { status: "MENUNGGU_VERIFIKASI", dueVerifyAt: { lt: now } }, select: { id: true, number: true, areaId: true, reporter: { select: { atasanId: true, areaId: true } } } });
  for (const r of verify) {
    if (reminded.has(r.id)) continue;
    await remind(r.id, r.number, await verifiersFor(r.reporter, r.areaId), `Verifikasi ${r.number} melewati batas waktu`, "Mohon segera diverifikasi.", "Pengingat otomatis: verifikasi melewati batas waktu");
  }

  // Keputusan lewat batas: Manager aktif area (atau seluruh Manager aktif), tanpa pelapor bila peninjauan sejawat aktif
  const decide = await db.report.findMany({ where: { status: "MENUNGGU_KEPUTUSAN", dueDecideAt: { lt: now } }, select: { id: true, number: true, areaId: true, reporterId: true } });
  for (const r of decide) {
    if (reminded.has(r.id)) continue;
    const managers = await managersForArea(r.areaId, settings.managerPeerReview ? r.reporterId : undefined);
    await remind(r.id, r.number, managers, `Keputusan ${r.number} melewati batas waktu`, "Mohon segera diputuskan.", "Pengingat otomatis: keputusan melewati batas waktu");
  }

  // Perbaikan lewat target: penanggung jawab dan pemutus yang masih aktif; cadangan Manager area
  const fix = await db.report.findMany({ where: { status: { in: ["DALAM_PERBAIKAN", "MENUNGGU_PENUTUPAN"] }, targetDate: { lt: now } }, select: { id: true, number: true, areaId: true, picId: true, deciderId: true } });
  for (const r of fix) {
    if (reminded.has(r.id)) continue;
    let targets = await activeIds([r.picId, r.deciderId]);
    if (!targets.length) targets = await managersForArea(r.areaId);
    await remind(r.id, r.number, targets, `Tindak lanjut ${r.number} melewati target`, "Perbaikan belum ditutup sesuai target.", "Pengingat otomatis: perbaikan melewati target");
  }

  return NextResponse.json({ ok: true, sent: stats.sent, unrouted: stats.unrouted, checked: { verify: verify.length, decide: decide.length, fix: fix.length } });
}
