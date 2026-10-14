"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { notify, audit } from "@/lib/notify";

export async function redeemAction(rewardId: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser(["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"]);
  const reward = await db.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.active) return { ok: false, message: "Hadiah tidak tersedia." };
  if (reward.stock <= 0) return { ok: false, message: "Stok hadiah habis." };
  const pending = await db.redemption.count({ where: { userId: user.id, status: { in: ["DIAJUKAN", "DIPROSES"] } } });
  if (pending >= 3) return { ok: false, message: "Maksimal tiga penukaran yang sedang diproses." };

  try {
    await db.$transaction(async (tx) => {
      const agg = await tx.pointLedger.aggregate({ where: { userId: user.id }, _sum: { points: true } });
      const balance = agg._sum.points ?? 0;
      if (balance < reward.pointsCost) throw new Error(`Poin belum cukup. Saldo ${balance}, dibutuhkan ${reward.pointsCost}.`);
      const stock = await tx.reward.updateMany({ where: { id: rewardId, active: true, stock: { gt: 0 } }, data: { stock: { decrement: 1 } } });
      if (stock.count !== 1) throw new Error("Stok hadiah habis.");
      await tx.redemption.create({ data: { userId: user.id, rewardId, pointsCost: reward.pointsCost } });
      await tx.pointLedger.create({ data: { userId: user.id, type: "PENUKARAN", points: -reward.pointsCost, note: `Penukaran ${reward.name}` } });
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Penukaran gagal." };
  }
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  await notify(admins.map((a) => a.id), `Penukaran poin diajukan: ${reward.name}`, `${user.name} menukar ${reward.pointsCost} poin.`, "/admin/penukaran");
  await audit(user.id, "PENUKARAN_DIAJUKAN", "Reward", rewardId, { points: reward.pointsCost });
  revalidatePath("/poin");
  return { ok: true, message: `Penukaran ${reward.name} diajukan. Tim pengelola akan memproses.` };
}
