"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { audit, notify } from "@/lib/notify";
import { getSettings, saveSettings } from "@/lib/settings";
import { ROLES, USER_STATUS, ROLE_LABEL, type AppSettings, type Role } from "@/lib/constants";
import { Prisma } from "@prisma/client";

/** Peran atasan yang sah untuk tiap peran (menentukan jalur verifikasi) */
const ATASAN_ROLES: Record<Role, Role[]> = {
  PENGAWAS: ["SUPERINTENDENT"],
  SUPERINTENDENT: ["MANAGER"],
  MANAGER: ["MANAGER", "DIREKSI"],
  DIREKSI: [],
  ADMIN: [],
};

function normNik(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim().toUpperCase();
  return s || null;
}

/** Memvalidasi atasan: ada, aktif, peran sesuai, dan tidak membentuk siklus */
async function validateAtasan(userId: string | null, role: Role, atasanId: string | null): Promise<string | null> {
  if (!atasanId) return null;
  if (atasanId === userId) return "Pengguna tidak dapat menjadi atasan dirinya sendiri.";
  const atasan = await db.user.findUnique({ where: { id: atasanId }, select: { role: true, status: true, name: true } });
  if (!atasan) return "Atasan tidak ditemukan.";
  if (atasan.status !== "ACTIVE") return `Atasan ${atasan.name ?? ""} tidak aktif.`;
  const allowed = ATASAN_ROLES[role];
  if (!allowed.includes(atasan.role as Role)) {
    return allowed.length ? `Atasan untuk peran ${ROLE_LABEL[role]} harus ${allowed.map((r) => ROLE_LABEL[r]).join(" atau ")}.` : `Peran ${ROLE_LABEL[role]} tidak memerlukan atasan.`;
  }
  if (userId) {
    let cur: string | null = atasanId;
    for (let i = 0; cur && i < 20; i++) {
      if (cur === userId) return "Susunan atasan membentuk siklus.";
      const next: { atasanId: string | null } | null = await db.user.findUnique({ where: { id: cur }, select: { atasanId: true } });
      cur = next?.atasanId ?? null;
    }
  }
  return null;
}

async function validateArea(areaId: string | null) {
  if (!areaId) return null;
  const a = await db.area.findUnique({ where: { id: areaId }, select: { id: true } });
  return a ? null : "Area tidak ditemukan.";
}

function isUnique(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

type Result = { ok: boolean; message: string };

export async function updateUserAction(userId: string, fd: FormData): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const role = String(fd.get("role"));
  const status = String(fd.get("status"));
  if (!ROLES.includes(role as Role) || !USER_STATUS.includes(status as (typeof USER_STATUS)[number])) return { ok: false, message: "Peran atau status tidak valid." };
  if (userId === admin.id && (role !== "ADMIN" || status !== "ACTIVE")) return { ok: false, message: "Anda tidak dapat menurunkan peran atau menonaktifkan akun sendiri." };
  const before = await db.user.findUnique({ where: { id: userId } });
  if (!before) return { ok: false, message: "Pengguna tidak ditemukan." };
  const nik = normNik(fd.get("nik"));
  if (nik) {
    const dup = await db.user.findFirst({ where: { nik: { equals: nik, mode: "insensitive" }, id: { not: userId } } });
    if (dup) return { ok: false, message: "NIK sudah digunakan pengguna lain." };
  }
  const data = {
    role,
    status,
    name: String(fd.get("name") ?? "").trim() || before.name,
    nik,
    jabatan: String(fd.get("jabatan") ?? "").trim() || null,
    departemen: String(fd.get("departemen") ?? "").trim() || null,
    areaId: String(fd.get("areaId") ?? "") || null,
    atasanId: String(fd.get("atasanId") ?? "") || null,
  };
  if (data.atasanId !== before.atasanId || role !== before.role) {
    const err = await validateAtasan(userId, role as Role, data.atasanId);
    if (err) return { ok: false, message: err };
  }
  if (data.areaId !== before.areaId) {
    const err = await validateArea(data.areaId);
    if (err) return { ok: false, message: err };
  }
  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data });
      // Manager yang berganti peran atau nonaktif dilepas dari area yang dikelolanya
      if (role !== "MANAGER" || status !== "ACTIVE") await tx.area.updateMany({ where: { managerId: userId }, data: { managerId: null } });
    });
  } catch (e) {
    if (isUnique(e)) return { ok: false, message: "NIK sudah digunakan pengguna lain." };
    throw e;
  }
  const leftovers = role !== before.role || status !== "ACTIVE"
    ? await db.report.count({ where: { status: { in: ["DALAM_PERBAIKAN", "MENUNGGU_PENUTUPAN"] }, picId: userId } })
    : 0;
  await audit(admin.id, "PENGGUNA_DIPERBARUI", "User", userId, { before: { role: before.role, status: before.status }, after: data });
  if (before.status !== "ACTIVE" && status === "ACTIVE") await notify([userId], "Akun Anda telah diaktifkan", `Peran: ${role}. Selamat bergabung di program PEDULI.`, "/beranda");
  revalidatePath("/admin/pengguna");
  revalidatePath("/admin/area");
  return { ok: true, message: leftovers ? `Pengguna diperbarui. Catatan: ${leftovers} tindak lanjut masih menunjuk pengguna ini sebagai penanggung jawab; pengingat akan dialihkan ke Manager area.` : "Pengguna diperbarui." };
}

export async function createUserAction(fd: FormData): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const name = String(fd.get("name") ?? "").trim();
  const role = String(fd.get("role") ?? "PENGAWAS");
  if (!email.includes("@") || !name) return { ok: false, message: "Nama dan email wajib diisi." };
  if (!ROLES.includes(role as Role)) return { ok: false, message: "Peran tidak valid." };
  if (await db.user.findUnique({ where: { email } })) return { ok: false, message: "Email sudah terdaftar." };
  const nik = normNik(fd.get("nik"));
  if (nik && (await db.user.findFirst({ where: { nik: { equals: nik, mode: "insensitive" } } }))) return { ok: false, message: "NIK sudah digunakan pengguna lain." };
  const areaId = String(fd.get("areaId") ?? "") || null;
  const atasanId = String(fd.get("atasanId") ?? "") || null;
  const err = (await validateAtasan(null, role as Role, atasanId)) ?? (await validateArea(areaId));
  if (err) return { ok: false, message: err };
  let u;
  try {
    u = await db.user.create({ data: { email, name, role, status: "ACTIVE", jabatan: String(fd.get("jabatan") ?? "").trim() || null, departemen: String(fd.get("departemen") ?? "").trim() || null, areaId, atasanId, nik } });
  } catch (e) {
    if (isUnique(e)) return { ok: false, message: "Email atau NIK sudah terdaftar." };
    throw e;
  }
  await audit(admin.id, "PENGGUNA_DIBUAT", "User", u.id, { email, role });
  revalidatePath("/admin/pengguna");
  return { ok: true, message: `Akun ${email} dibuat. Pengguna dapat langsung masuk dengan akun Google tersebut.` };
}

export async function saveAreaAction(areaId: string | null, fd: FormData): Promise<Result> {
  const user = await requireUser(["ADMIN", "MANAGER"]);
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  const name = String(fd.get("name") ?? "").trim();
  if (!code || !name) return { ok: false, message: "Kode dan nama area wajib diisi." };
  const lat = fd.get("lat") ? Number(fd.get("lat")) : null;
  const lng = fd.get("lng") ? Number(fd.get("lng")) : null;
  const radiusM = Math.max(20, Math.min(5000, Number(fd.get("radiusM") || 300)));
  const managerId = String(fd.get("managerId") ?? "") || null;
  const active = fd.get("active") !== "false";
  if (lat != null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) return { ok: false, message: "Latitude tidak valid." };
  if (lng != null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) return { ok: false, message: "Longitude tidak valid." };
  if ((lat == null) !== (lng == null)) return { ok: false, message: "Isi latitude dan longitude sekaligus, atau kosongkan keduanya." };
  if (managerId) {
    const m = await db.user.findUnique({ where: { id: managerId }, select: { role: true, status: true } });
    if (!m || m.role !== "MANAGER" || m.status !== "ACTIVE") return { ok: false, message: "Manager area harus pengguna aktif dengan peran Manager." };
  }
  const data = { code, name, lat, lng, radiusM, managerId, active };
  try {
    if (areaId) await db.area.update({ where: { id: areaId }, data });
    else await db.area.create({ data });
  } catch {
    return { ok: false, message: "Kode area harus unik." };
  }
  await audit(user.id, areaId ? "AREA_DIPERBARUI" : "AREA_DIBUAT", "Area", areaId ?? code, data);
  revalidatePath("/admin/area");
  return { ok: true, message: "Area tersimpan." };
}

export async function saveRewardAction(rewardId: string | null, fd: FormData): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const name = String(fd.get("name") ?? "").trim();
  const pointsCost = Number(fd.get("pointsCost"));
  if (!name || !(pointsCost > 0)) return { ok: false, message: "Nama dan nilai poin wajib diisi." };
  const stockInput = Math.max(0, Math.round(Number(fd.get("stock") || 0)));
  const base = { name, description: String(fd.get("description") ?? "").trim() || null, pointsCost: Math.round(pointsCost), tier: String(fd.get("tier") || "AWAL"), icon: String(fd.get("icon") || "Package"), active: fd.get("active") !== "false" };
  const data = { ...base, stock: stockInput };
  if (rewardId) {
    // Stok diubah sebagai selisih terhadap nilai yang dilihat admin, agar penukaran yang terjadi bersamaan tidak tertimpa
    const seen = Number(fd.get("stockOriginal"));
    const delta = Number.isFinite(seen) ? stockInput - seen : null;
    await db.$transaction(async (tx) => {
      await tx.reward.update({ where: { id: rewardId }, data: delta === null ? data : { ...base, stock: { increment: delta } } });
      await tx.reward.updateMany({ where: { id: rewardId, stock: { lt: 0 } }, data: { stock: 0 } });
    });
  } else await db.reward.create({ data });
  await audit(admin.id, rewardId ? "REWARD_DIPERBARUI" : "REWARD_DIBUAT", "Reward", rewardId ?? name, data);
  revalidatePath("/admin/reward");
  revalidatePath("/poin");
  return { ok: true, message: "Katalog tersimpan." };
}

export async function processRedemptionAction(id: string, status: "DIPROSES" | "SELESAI" | "DITOLAK", note: string): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  if (!["DIPROSES", "SELESAI", "DITOLAK"].includes(status)) return { ok: false, message: "Status tidak valid." };
  const r = await db.redemption.findUnique({ where: { id }, include: { reward: true } });
  if (!r) return { ok: false, message: "Penukaran tidak ditemukan." };
  if (r.status === "SELESAI" || r.status === "DITOLAK") return { ok: false, message: "Penukaran sudah final." };
  const changed = await db.$transaction(async (tx) => {
    const upd = await tx.redemption.updateMany({ where: { id, status: { in: ["DIAJUKAN", "DIPROSES"] } }, data: { status, note: note || null, processedById: admin.id, processedAt: new Date() } });
    if (upd.count !== 1) return false;
    if (status === "DITOLAK") {
      await tx.pointLedger.create({ data: { userId: r.userId, type: "PENYESUAIAN", points: r.pointsCost, note: `Pengembalian poin: ${r.reward.name} ditolak` } });
      await tx.reward.update({ where: { id: r.rewardId }, data: { stock: { increment: 1 } } });
    }
    return true;
  });
  if (!changed) return { ok: false, message: "Penukaran sudah diproses oleh admin lain." };
  await notify([r.userId], `Penukaran ${r.reward.name}: ${status === "SELESAI" ? "selesai" : status === "DIPROSES" ? "sedang diproses" : "ditolak"}`, note || undefined, "/poin");
  await audit(admin.id, "PENUKARAN_DIPROSES", "Redemption", id, { status, note });
  revalidatePath("/admin/penukaran");
  return { ok: true, message: "Penukaran diperbarui." };
}

export async function adjustPointsAction(userId: string, points: number, note: string): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  if (!Number.isInteger(points) || points === 0) return { ok: false, message: "Nilai poin harus bilangan bulat bukan nol." };
  if (!note.trim()) return { ok: false, message: "Alasan penyesuaian wajib diisi." };
  await db.pointLedger.create({ data: { userId, type: "PENYESUAIAN", points, note } });
  await notify([userId], `Penyesuaian poin ${points > 0 ? "+" : ""}${points}`, note, "/poin");
  await audit(admin.id, "POIN_DISESUAIKAN", "User", userId, { points, note });
  revalidatePath("/admin/pengguna");
  return { ok: true, message: "Poin disesuaikan." };
}

export async function saveSettingsAction(fd: FormData): Promise<Result> {
  const user = await requireUser(["ADMIN", "MANAGER"]);
  const cur = await getSettings();
  const num = (k: string, def: number, min = 0, max = 365) => Math.max(min, Math.min(max, Number(fd.get(k) ?? def) || def));
  const next: AppSettings = {
    verificationRequired: true,
    verifyDeadlineDays: num("verifyDeadlineDays", cur.verifyDeadlineDays, 1, 30),
    decideDeadlineDays: num("decideDeadlineDays", cur.decideDeadlineDays, 1, 30),
    escalateHighRisk: fd.get("escalateHighRisk") === "on",
    reminders: fd.get("reminders") === "on",
    picByArea: fd.get("picByArea") === "on",
    managerPeerReview: fd.get("managerPeerReview") === "on",
    points: user.role === "ADMIN"
      ? { valid: num("p_valid", cur.points.valid, 0, 100), nearMiss: num("p_nearMiss", cur.points.nearMiss, 0, 100), highRiskBonus: num("p_highRiskBonus", cur.points.highRiskBonus, 0, 100), suggestionBonus: num("p_suggestionBonus", cur.points.suggestionBonus, 0, 100), streakBonus: num("p_streakBonus", cur.points.streakBonus, 0, 100) }
      : cur.points,
    levels: user.role === "ADMIN" ? { perak: num("l_perak", cur.levels.perak, 1, 100000), emas: num("l_emas", cur.levels.emas, 1, 100000) } : cur.levels,
    eligibleRoles: user.role === "ADMIN" ? (ROLES.filter((r) => fd.get(`elig_${r}`) === "on") as Role[]) : cur.eligibleRoles,
  };
  await saveSettings(next, user.id);
  await audit(user.id, "PENGATURAN_DIUBAH", "Setting", "alur", { before: cur, after: next });
  revalidatePath("/admin/pengaturan");
  return { ok: true, message: "Pengaturan tersimpan dan tercatat pada jejak audit." };
}
