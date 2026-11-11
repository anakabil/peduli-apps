import { db } from "./db";
import { DEMO_DOMAIN, SAMPLE_AREAS, SAMPLE_REWARDS } from "./demo-accounts";

/**
 * Pembersihan data uji sebelum uji coba lapangan.
 * Transaksi (laporan, poin, penukaran, notifikasi) dihapus seluruhnya; akun nyata, pengaturan, dan perangkat terdaftar tetap.
 * Akun demo, area contoh, dan reward contoh dihapus hanya bila dipilih admin.
 */
export type ResetOptions = { transactions: boolean; demoUsers: boolean; areaIds: string[]; rewardIds: string[]; audit: boolean };

const demoUserWhere = { email: { endsWith: DEMO_DOMAIN } };

export async function previewReset() {
  const sampleCodes = SAMPLE_AREAS.map((a) => a.code as string);
  const [reports, photos, ledger, redemptions, notifications, consultations, demoUsers, auditLogs, areas, rewards] = await Promise.all([
    db.report.count(),
    db.photo.count(),
    db.pointLedger.count(),
    db.redemption.count(),
    db.notification.count(),
    db.consultation.count(),
    db.user.findMany({ where: demoUserWhere, select: { id: true, name: true, role: true } }),
    db.auditLog.count(),
    db.area.findMany({ where: { code: { in: sampleCodes } }, select: { id: true, code: true, name: true, lat: true, lng: true, _count: { select: { users: { where: { NOT: demoUserWhere } } } } } }),
    db.reward.findMany({ where: { OR: SAMPLE_REWARDS.map((r) => ({ name: r.name, description: r.description })) }, select: { id: true, name: true } }),
  ]);
  return {
    reports,
    photos,
    ledger,
    redemptions,
    notifications,
    consultations,
    demoUsers,
    auditLogs,
    // Area contoh yang belum diubah dan tidak dipakai akun nyata disarankan untuk dihapus
    areas: areas.map((a) => {
      const orig = SAMPLE_AREAS.find((s) => s.code === a.code)!;
      const unchanged = a.name === orig.name && a.lat === orig.lat && a.lng === orig.lng;
      return { id: a.id, code: a.code, name: a.name, realUsers: a._count.users, suggested: unchanged && a._count.users === 0 };
    }),
    rewards,
  };
}

export async function runReset(opts: ResetOptions) {
  // Akun demo dan reward contoh masih dirujuk laporan dan penukaran, jadi hanya dapat dihapus bersama transaksi
  if ((opts.demoUsers || opts.rewardIds.length) && !opts.transactions) throw new Error("Akun demo dan reward contoh hanya dapat dihapus bersama data transaksi.");
  return db.$transaction(
    async (tx) => {
      const done: Record<string, number> = {};
      if (opts.transactions) {
        // Stok hadiah dikembalikan untuk penukaran yang belum ditolak (penolakan sudah mengembalikan stok)
        const open = await tx.redemption.groupBy({ by: ["rewardId"], where: { status: { not: "DITOLAK" } }, _count: { _all: true } });
        for (const r of open) await tx.reward.update({ where: { id: r.rewardId }, data: { stock: { increment: r._count._all } } });
        done.penukaran = (await tx.redemption.deleteMany({})).count;
        done.poin = (await tx.pointLedger.deleteMany({})).count;
        done.notifikasi = (await tx.notification.deleteMany({})).count;
        done.konsultasi = (await tx.consultation.deleteMany({})).count;
        // Foto dan riwayat laporan ikut terhapus (cascade)
        done.laporan = (await tx.report.deleteMany({})).count;
        // Penomoran laporan dimulai lagi dari 0001
        await tx.counter.deleteMany({});
      }
      if (opts.rewardIds.length) done.reward = (await tx.reward.deleteMany({ where: { id: { in: opts.rewardIds } } })).count;
      if (opts.demoUsers) done.akunDemo = (await tx.user.deleteMany({ where: demoUserWhere })).count;
      if (opts.areaIds.length) {
        const sample = new Set<string>(SAMPLE_AREAS.map((a) => a.code));
        const ids = (await tx.area.findMany({ where: { id: { in: opts.areaIds } }, select: { id: true, code: true } })).filter((a) => sample.has(a.code)).map((a) => a.id);
        done.area = (await tx.area.deleteMany({ where: { id: { in: ids } } })).count;
      }
      if (opts.audit) done.jejakAudit = (await tx.auditLog.deleteMany({})).count;
      return done;
    },
    { timeout: 60000, maxWait: 10000 },
  );
}
