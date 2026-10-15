import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { notify } from "@/lib/notify";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Pengingat otomatis bila melewati batas waktu. Dijalankan harian oleh penjadwal (Vercel Cron atau cron server):
 * GET /api/cron/pengingat dengan header Authorization: Bearer CRON_SECRET
 */
export async function GET(req: Request) {
  const secret = env("CRON_SECRET");
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized. Atur CRON_SECRET dan kirim header Authorization: Bearer <secret>." }, { status: 401 });
  const settings = await getSettings();
  if (!settings.reminders) return NextResponse.json({ ok: true, skipped: "pengingat nonaktif" });

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86400000);
  let sent = 0;
  const recentlyReminded = async (reportId: string) => !!(await db.reportEvent.findFirst({ where: { reportId, type: "PENGINGAT", createdAt: { gte: dayAgo } } }));

  // Verifikasi lewat batas
  const verify = await db.report.findMany({ where: { status: "MENUNGGU_VERIFIKASI", dueVerifyAt: { lt: now } }, include: { reporter: true } });
  for (const r of verify) {
    if (await recentlyReminded(r.id)) continue;
    const targets = r.reporter.atasanId ? [r.reporter.atasanId] : (await db.user.findMany({ where: { role: "SUPERINTENDENT", status: "ACTIVE", areaId: r.reporter.areaId ?? undefined }, select: { id: true } })).map((u) => u.id);
    await notify(targets, `Verifikasi ${r.number} melewati batas waktu`, "Mohon segera diverifikasi.", `/laporan/${r.id}`);
    await db.reportEvent.create({ data: { reportId: r.id, type: "PENGINGAT", note: "Pengingat otomatis: verifikasi melewati batas waktu" } });
    sent++;
  }
  // Keputusan lewat batas
  const decide = await db.report.findMany({ where: { status: "MENUNGGU_KEPUTUSAN", dueDecideAt: { lt: now } }, include: { area: true } });
  for (const r of decide) {
    if (await recentlyReminded(r.id)) continue;
    const managers = await db.user.findMany({ where: { role: "MANAGER", status: "ACTIVE", ...(r.area?.managerId ? { id: r.area.managerId } : {}) }, select: { id: true } });
    await notify(managers.map((m) => m.id), `Keputusan ${r.number} melewati batas waktu`, "Mohon segera diputuskan.", `/laporan/${r.id}`);
    await db.reportEvent.create({ data: { reportId: r.id, type: "PENGINGAT", note: "Pengingat otomatis: keputusan melewati batas waktu" } });
    sent++;
  }
  // Perbaikan lewat target
  const fix = await db.report.findMany({ where: { status: { in: ["DALAM_PERBAIKAN", "MENUNGGU_PENUTUPAN"] }, targetDate: { lt: now } } });
  for (const r of fix) {
    if (await recentlyReminded(r.id)) continue;
    await notify([r.picId, r.deciderId], `Tindak lanjut ${r.number} melewati target`, "Perbaikan belum ditutup sesuai target.", `/laporan/${r.id}`);
    await db.reportEvent.create({ data: { reportId: r.id, type: "PENGINGAT", note: "Pengingat otomatis: perbaikan melewati target" } });
    sent++;
  }
  return NextResponse.json({ ok: true, sent, checked: { verify: verify.length, decide: decide.length, fix: fix.length } });
}
