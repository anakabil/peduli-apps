/**
 * Penghapusan akun pengguna.
 *
 * Akun nyata yang sudah memiliki riwayat kerja (laporan, peran dalam laporan, poin,
 * penukaran, konsultasi) tidak dihapus agar jejak SMK3 tetap utuh; akun tersebut cukup
 * dinonaktifkan. Akun dummy (domain demo) boleh dihapus beserta seluruh datanya.
 */
import { db } from "@/lib/db";
import { DEMO_DOMAIN } from "@/lib/demo-accounts";
import type { Lang } from "@/lib/i18n";

export const isDummyEmail = (email: string | null | undefined) => !!email?.toLowerCase().endsWith(DEMO_DOMAIN);

export type History = { laporan: number; ditangani: number; poin: number; penukaran: number; konsultasi: number };

export async function userHistory(id: string): Promise<History> {
  const [laporan, ditangani, poin, penukaran, konsultasi] = await Promise.all([
    db.report.count({ where: { reporterId: id } }),
    db.report.count({ where: { OR: [{ verifierId: id }, { deciderId: id }, { picId: id }, { closerId: id }, { proposedPicId: id }] } }),
    db.pointLedger.count({ where: { userId: id } }),
    db.redemption.count({ where: { OR: [{ userId: id }, { processedById: id }] } }),
    db.consultation.count({ where: { askerId: id } }),
  ]);
  return { laporan, ditangani, poin, penukaran, konsultasi };
}

export function describeHistory(h: History, lang: Lang = "id") {
  const en = lang === "en";
  const n = (v: number, one: string, many: string) => `${v} ${v === 1 ? one : many}`;
  const parts = [
    h.laporan && (en ? n(h.laporan, "hazard report", "hazard reports") : `${h.laporan} laporan`),
    h.ditangani && (en ? n(h.ditangani, "report handled", "reports handled") : `${h.ditangani} laporan yang ditangani`),
    h.poin && (en ? n(h.poin, "point record", "point records") : `${h.poin} catatan poin`),
    h.penukaran && (en ? n(h.penukaran, "redemption", "redemptions") : `${h.penukaran} penukaran`),
    h.konsultasi && (en ? n(h.konsultasi, "consultation", "consultations") : `${h.konsultasi} konsultasi`),
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Menghapus akun beserta data miliknya dalam satu transaksi.
 * Laporan yang dibuat akun ini ikut terhapus; rujukan akun ini pada data orang lain dikosongkan.
 */
export async function purgeUsers(ids: string[]) {
  if (!ids.length) return { users: 0, laporan: 0 };
  return db.$transaction(
    async (tx) => {
      const reportIds = (await tx.report.findMany({ where: { reporterId: { in: ids } }, select: { id: true } })).map((r) => r.id);
      // Poin milik akun ini dihapus; poin orang lain yang merujuk laporan ini tetap ada tanpa rujukan
      await tx.pointLedger.deleteMany({ where: { userId: { in: ids } } });
      if (reportIds.length) await tx.pointLedger.updateMany({ where: { reportId: { in: reportIds } }, data: { reportId: null } });
      // Stok hadiah dikembalikan untuk penukaran yang belum ditolak
      const open = await tx.redemption.groupBy({ by: ["rewardId"], where: { userId: { in: ids }, status: { not: "DITOLAK" } }, _count: { _all: true } });
      for (const r of open) await tx.reward.update({ where: { id: r.rewardId }, data: { stock: { increment: r._count._all } } });
      await tx.redemption.deleteMany({ where: { userId: { in: ids } } });
      await tx.redemption.updateMany({ where: { processedById: { in: ids } }, data: { processedById: null } });
      await tx.consultation.deleteMany({ where: { askerId: { in: ids } } });
      // Foto dan riwayat laporan ikut terhapus (cascade)
      const laporan = reportIds.length ? (await tx.report.deleteMany({ where: { id: { in: reportIds } } })).count : 0;
      await tx.report.updateMany({ where: { verifierId: { in: ids } }, data: { verifierId: null } });
      await tx.report.updateMany({ where: { deciderId: { in: ids } }, data: { deciderId: null } });
      await tx.report.updateMany({ where: { picId: { in: ids } }, data: { picId: null } });
      await tx.report.updateMany({ where: { closerId: { in: ids } }, data: { closerId: null } });
      await tx.report.updateMany({ where: { proposedPicId: { in: ids } }, data: { proposedPicId: null } });
      await tx.reportEvent.updateMany({ where: { actorId: { in: ids } }, data: { actorId: null } });
      await tx.auditLog.updateMany({ where: { actorId: { in: ids } }, data: { actorId: null } });
      await tx.user.updateMany({ where: { atasanId: { in: ids } }, data: { atasanId: null } });
      await tx.area.updateMany({ where: { managerId: { in: ids } }, data: { managerId: null } });
      // Akun Google, sesi, notifikasi, dan langganan notifikasi ponsel ikut terhapus (cascade)
      const users = (await tx.user.deleteMany({ where: { id: { in: ids } } })).count;
      return { users, laporan };
    },
    { timeout: 60000, maxWait: 10000 },
  );
}
