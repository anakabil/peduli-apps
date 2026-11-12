"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { notify, audit } from "@/lib/notify";
import { getSettings } from "@/lib/settings";
import { isEligible, lockUser } from "@/lib/points";
import { bi } from "@/lib/i18n";
import { getTr } from "@/lib/i18n-server";

export async function redeemAction(rewardId: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser(["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"]);
  const { tr } = await getTr();
  const settings = await getSettings();
  if (!isEligible(user.role, settings)) return { ok: false, message: tr("Peran Anda tidak termasuk penerima poin sesuai pengaturan program.", "Your role is not eligible for points under the program settings.") };
  const reward = await db.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.active) return { ok: false, message: tr("Hadiah tidak tersedia.", "This reward is not available.") };
  if (reward.stock <= 0) return { ok: false, message: tr("Stok hadiah habis.", "This reward is out of stock.") };

  try {
    await db.$transaction(async (tx) => {
      // Kunci baris pengguna: penukaran bersamaan dari pengguna yang sama diproses berurutan
      await lockUser(tx, user.id);
      const pending = await tx.redemption.count({ where: { userId: user.id, status: { in: ["DIAJUKAN", "DIPROSES"] } } });
      if (pending >= 3) throw new Error(tr("Maksimal tiga penukaran yang sedang diproses.", "You can have at most three redemptions in progress."));
      const agg = await tx.pointLedger.aggregate({ where: { userId: user.id }, _sum: { points: true } });
      const balance = agg._sum.points ?? 0;
      if (balance < reward.pointsCost) throw new Error(tr(`Poin belum cukup. Saldo ${balance}, dibutuhkan ${reward.pointsCost}.`, `Not enough points. Balance ${balance}, required ${reward.pointsCost}.`));
      const stock = await tx.reward.updateMany({ where: { id: rewardId, active: true, stock: { gt: 0 } }, data: { stock: { decrement: 1 } } });
      if (stock.count !== 1) throw new Error(tr("Stok hadiah habis.", "This reward is out of stock."));
      await tx.redemption.create({ data: { userId: user.id, rewardId, pointsCost: reward.pointsCost } });
      // Catatan disimpan dalam bahasa Indonesia; tampilannya diterjemahkan oleh ledgerNote()
      await tx.pointLedger.create({ data: { userId: user.id, type: "PENUKARAN", points: -reward.pointsCost, note: `Penukaran ${reward.name}` } });
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : tr("Penukaran gagal.", "Redemption failed.") };
  }
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  await notify(
    "ADMINISTRASI",
    admins.map((a) => a.id),
    bi(`Penukaran poin diajukan: ${reward.name}`, `Point redemption submitted: ${reward.name}`),
    bi(`${user.name} menukar ${reward.pointsCost} poin.`, `${user.name} redeemed ${reward.pointsCost} points.`),
    "/admin/penukaran",
  );
  await audit(user.id, "PENUKARAN_DIAJUKAN", "Reward", rewardId, { points: reward.pointsCost });
  revalidatePath("/poin");
  return { ok: true, message: tr(`Penukaran ${reward.name} diajukan. Tim pengelola akan memproses.`, `Redemption of ${reward.name} submitted. The program team will process it.`) };
}
