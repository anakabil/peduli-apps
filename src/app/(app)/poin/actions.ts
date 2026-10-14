"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { pointBalance } from "@/lib/points";
import { notify, audit } from "@/lib/notify";

export async function redeemAction(rewardId: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser(["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"]);
  const reward = await db.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.active) return { ok: false, message: "Hadiah tidak tersedia." };
  if (reward.stock <= 0) return { ok: false, message: "Stok hadiah habis." };
  const balance = await pointBalance(user.id);
  if (balance < reward.pointsCost) return { ok: false, message: `Poin belum cukup. Saldo ${balance}, dibutuhkan ${reward.pointsCost}.` };
  const pending = await db.redemption.count({ where: { userId: user.id, status: { in: ["DIAJUKAN", "DIPROSES"] } } });
  if (pending >= 3) return { ok: false, message: "Maksimal tiga penukaran yang sedang diproses." };

  await db.$transaction([
    db.redemption.create({ data: { userId: user.id, rewardId, pointsCost: reward.pointsCost } }),
    db.pointLedger.create({ data: { userId: user.id, type: "PENUKARAN", points: -reward.pointsCost, note: `Penukaran ${reward.name}` } }),
    db.reward.update({ where: { id: rewardId }, data: { stock: { decrement: 1 } } }),
  ]);
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  await notify(admins.map((a) => a.id), `Penukaran poin diajukan: ${reward.name}`, `${user.name} menukar ${reward.pointsCost} poin.`, "/admin/penukaran");
  await audit(user.id, "PENUKARAN_DIAJUKAN", "Reward", rewardId, { points: reward.pointsCost });
  revalidatePath("/poin");
  return { ok: true, message: `Penukaran ${reward.name} diajukan. Tim pengelola akan memproses.` };
}
