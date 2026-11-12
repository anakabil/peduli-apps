"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { audit, notify } from "@/lib/notify";
import { getSettings, saveSettings } from "@/lib/settings";
import { ROLES, USER_STATUS, NOTIF_TYPES, labels, type AppSettings, type Role } from "@/lib/constants";
import { Prisma } from "@prisma/client";
import { isRewardIcon } from "@/lib/reward-icons";
import { runReset } from "@/lib/reset";
import { DEMO_DOMAIN } from "@/lib/demo-accounts";
import { normalizeRewardPhoto } from "@/lib/image";
import { isDummyEmail, userHistory, describeHistory, purgeUsers } from "@/lib/user-delete";
import { getTr } from "@/lib/i18n-server";
import { bi, type Lang, type Tr } from "@/lib/i18n";

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
async function validateAtasan(userId: string | null, role: Role, atasanId: string | null, lang: Lang, tr: Tr): Promise<string | null> {
  if (!atasanId) return null;
  if (atasanId === userId) return tr("Pengguna tidak dapat menjadi atasan dirinya sendiri.", "A user cannot be their own superior.");
  const atasan = await db.user.findUnique({ where: { id: atasanId }, select: { role: true, status: true, name: true } });
  if (!atasan) return tr("Atasan tidak ditemukan.", "Superior not found.");
  if (atasan.status !== "ACTIVE") return tr(`Atasan ${atasan.name ?? ""} tidak aktif.`, `Superior ${atasan.name ?? ""} is inactive.`);
  const allowed = ATASAN_ROLES[role];
  if (!allowed.includes(atasan.role as Role)) {
    const RL = labels(lang).ROLE_LABEL;
    return allowed.length
      ? tr(`Atasan untuk peran ${RL[role]} harus ${allowed.map((r) => RL[r]).join(" atau ")}.`, `The superior for the ${RL[role]} role must be a ${allowed.map((r) => RL[r]).join(" or ")}.`)
      : tr(`Peran ${RL[role]} tidak memerlukan atasan.`, `The ${RL[role]} role does not require a superior.`);
  }
  if (userId) {
    let cur: string | null = atasanId;
    for (let i = 0; cur && i < 20; i++) {
      if (cur === userId) return tr("Susunan atasan membentuk siklus.", "The reporting line forms a loop.");
      const next: { atasanId: string | null } | null = await db.user.findUnique({ where: { id: cur }, select: { atasanId: true } });
      cur = next?.atasanId ?? null;
    }
  }
  return null;
}

async function validateArea(areaId: string | null, tr: Tr) {
  if (!areaId) return null;
  const a = await db.area.findUnique({ where: { id: areaId }, select: { id: true } });
  return a ? null : tr("Area tidak ditemukan.", "Work area not found.");
}

function isUnique(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

type Result = { ok: boolean; message: string };

export async function updateUserAction(userId: string, fd: FormData): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const { lang, tr } = await getTr();
  const role = String(fd.get("role"));
  const status = String(fd.get("status"));
  if (!ROLES.includes(role as Role) || !USER_STATUS.includes(status as (typeof USER_STATUS)[number])) return { ok: false, message: tr("Peran atau status tidak valid.", "Invalid role or status.") };
  if (userId === admin.id && (role !== "ADMIN" || status !== "ACTIVE")) return { ok: false, message: tr("Anda tidak dapat menurunkan peran atau menonaktifkan akun sendiri.", "You cannot downgrade the role of, or deactivate, your own account.") };
  const before = await db.user.findUnique({ where: { id: userId } });
  if (!before) return { ok: false, message: tr("Pengguna tidak ditemukan.", "User not found.") };
  const nik = normNik(fd.get("nik"));
  if (nik) {
    const dup = await db.user.findFirst({ where: { nik: { equals: nik, mode: "insensitive" }, id: { not: userId } } });
    if (dup) return { ok: false, message: tr("NIK sudah digunakan pengguna lain.", "This employee ID (NIK) is already used by another user.") };
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
    const err = await validateAtasan(userId, role as Role, data.atasanId, lang, tr);
    if (err) return { ok: false, message: err };
  }
  if (data.areaId !== before.areaId) {
    const err = await validateArea(data.areaId, tr);
    if (err) return { ok: false, message: err };
  }
  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data });
      // Manager yang berganti peran atau nonaktif dilepas dari area yang dikelolanya
      if (role !== "MANAGER" || status !== "ACTIVE") await tx.area.updateMany({ where: { managerId: userId }, data: { managerId: null } });
    });
  } catch (e) {
    if (isUnique(e)) return { ok: false, message: tr("NIK sudah digunakan pengguna lain.", "This employee ID (NIK) is already used by another user.") };
    throw e;
  }
  const leftovers = role !== before.role || status !== "ACTIVE"
    ? await db.report.count({ where: { status: { in: ["DALAM_PERBAIKAN", "MENUNGGU_PENUTUPAN"] }, picId: userId } })
    : 0;
  await audit(admin.id, "PENGGUNA_DIPERBARUI", "User", userId, { before: { role: before.role, status: before.status }, after: data });
  if (before.status !== "ACTIVE" && status === "ACTIVE")
    await notify("ADMINISTRASI", [userId], bi("Akun Anda telah diaktifkan", "Your account has been activated"), bi(`Peran: ${role}. Selamat bergabung di program PEDULI.`, `Role: ${labels("en").ROLE_LABEL[role as Role]}. Welcome to the PEDULI program.`), "/beranda");
  revalidatePath("/admin/pengguna");
  revalidatePath("/admin/area");
  return {
    ok: true,
    message: leftovers
      ? tr(
          `Pengguna diperbarui. Catatan: ${leftovers} tindak lanjut masih menunjuk pengguna ini sebagai penanggung jawab; pengingat akan dialihkan ke Manager area.`,
          `User updated. Note: ${leftovers} follow-up${leftovers === 1 ? " still names" : "s still name"} this user as the person in charge (PIC); reminders will be redirected to the area Manager.`,
        )
      : tr("Pengguna diperbarui.", "User updated."),
  };
}

export async function createUserAction(fd: FormData): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const name = String(fd.get("name") ?? "").trim();
  const { lang, tr } = await getTr();
  const role = String(fd.get("role") ?? "PENGAWAS");
  if (!email.includes("@") || !name) return { ok: false, message: tr("Nama dan email wajib diisi.", "Name and email are required.") };
  if (!ROLES.includes(role as Role)) return { ok: false, message: tr("Peran tidak valid.", "Invalid role.") };
  if (await db.user.findUnique({ where: { email } })) return { ok: false, message: tr("Email sudah terdaftar.", "This email is already registered.") };
  const nik = normNik(fd.get("nik"));
  if (nik && (await db.user.findFirst({ where: { nik: { equals: nik, mode: "insensitive" } } }))) return { ok: false, message: tr("NIK sudah digunakan pengguna lain.", "This employee ID (NIK) is already used by another user.") };
  const areaId = String(fd.get("areaId") ?? "") || null;
  const atasanId = String(fd.get("atasanId") ?? "") || null;
  const err = (await validateAtasan(null, role as Role, atasanId, lang, tr)) ?? (await validateArea(areaId, tr));
  if (err) return { ok: false, message: err };
  let u;
  try {
    u = await db.user.create({ data: { email, name, role, status: "ACTIVE", jabatan: String(fd.get("jabatan") ?? "").trim() || null, departemen: String(fd.get("departemen") ?? "").trim() || null, areaId, atasanId, nik } });
  } catch (e) {
    if (isUnique(e)) return { ok: false, message: tr("Email atau NIK sudah terdaftar.", "This email or employee ID (NIK) is already registered.") };
    throw e;
  }
  await audit(admin.id, "PENGGUNA_DIBUAT", "User", u.id, { email, role });
  revalidatePath("/admin/pengguna");
  return { ok: true, message: tr(`Akun ${email} dibuat. Pengguna dapat langsung masuk dengan akun Google tersebut.`, `Account ${email} created. The user can sign in right away with that Google account.`) };
}

export async function saveAreaAction(areaId: string | null, fd: FormData): Promise<Result> {
  const user = await requireUser(["ADMIN", "MANAGER"]);
  const { tr } = await getTr();
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  const name = String(fd.get("name") ?? "").trim();
  if (!code || !name) return { ok: false, message: tr("Kode dan nama area wajib diisi.", "Area code and name are required.") };
  const lat = fd.get("lat") ? Number(fd.get("lat")) : null;
  const lng = fd.get("lng") ? Number(fd.get("lng")) : null;
  const radiusM = Math.max(20, Math.min(5000, Number(fd.get("radiusM") || 300)));
  const managerId = String(fd.get("managerId") ?? "") || null;
  const active = fd.get("active") !== "false";
  if (lat != null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) return { ok: false, message: tr("Latitude tidak valid.", "Invalid latitude.") };
  if (lng != null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) return { ok: false, message: tr("Longitude tidak valid.", "Invalid longitude.") };
  if ((lat == null) !== (lng == null)) return { ok: false, message: tr("Isi latitude dan longitude sekaligus, atau kosongkan keduanya.", "Enter both latitude and longitude, or leave both blank.") };
  if (managerId) {
    const m = await db.user.findUnique({ where: { id: managerId }, select: { role: true, status: true } });
    if (!m || m.role !== "MANAGER" || m.status !== "ACTIVE") return { ok: false, message: tr("Manager area harus pengguna aktif dengan peran Manager.", "The area Manager must be an active user with the Manager role.") };
  }
  const data = { code, name, lat, lng, radiusM, managerId, active };
  try {
    if (areaId) await db.area.update({ where: { id: areaId }, data });
    else await db.area.create({ data });
  } catch {
    return { ok: false, message: tr("Kode area harus unik.", "The area code must be unique.") };
  }
  await audit(user.id, areaId ? "AREA_DIPERBARUI" : "AREA_DIBUAT", "Area", areaId ?? code, data);
  revalidatePath("/admin/area");
  return { ok: true, message: tr("Area tersimpan.", "Work area saved.") };
}

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO = 4 * 1024 * 1024;

export async function saveRewardAction(rewardId: string | null, fd: FormData): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const { tr } = await getTr();
  const name = String(fd.get("name") ?? "").trim();
  const pointsCost = Number(fd.get("pointsCost"));
  if (!name || !(pointsCost > 0)) return { ok: false, message: tr("Nama dan nilai poin wajib diisi.", "Name and point value are required.") };
  const stockInput = Math.max(0, Math.round(Number(fd.get("stock") || 0)));
  const iconIn = String(fd.get("icon") || "gift");
  const icon = isRewardIcon(iconIn) ? iconIn : "gift";

  // Foto opsional: diunggah baru, dipertahankan, atau dihapus untuk kembali memakai ikon
  const file = fd.get("photo");
  let photo: Uint8Array<ArrayBuffer> | null = null;
  if (file instanceof File && file.size > 0) {
    if (!PHOTO_TYPES.includes(file.type)) return { ok: false, message: tr("Format foto harus JPEG, PNG, atau WebP.", "The photo must be JPEG, PNG, or WebP.") };
    if (file.size > MAX_PHOTO) return { ok: false, message: tr("Ukuran foto maksimal 4 MB.", "The photo must not exceed 4 MB.") };
    try {
      photo = await normalizeRewardPhoto(new Uint8Array(await file.arrayBuffer()));
    } catch {
      return { ok: false, message: tr("Foto tidak dapat dibaca. Coba berkas lain.", "The photo could not be read. Try another file.") };
    }
  }
  const removePhoto = !photo && fd.get("removePhoto") === "1";

  const base = { name, description: String(fd.get("description") ?? "").trim() || null, pointsCost: Math.round(pointsCost), tier: String(fd.get("tier") || "AWAL"), icon, active: fd.get("active") !== "false" };
  const data = { ...base, stock: stockInput };
  const imageAt = photo ? new Date() : removePhoto ? null : undefined;
  let id = rewardId;
  if (rewardId) {
    // Stok diubah sebagai selisih terhadap nilai yang dilihat admin, agar penukaran yang terjadi bersamaan tidak tertimpa
    const seen = Number(fd.get("stockOriginal"));
    const delta = Number.isFinite(seen) ? stockInput - seen : null;
    await db.$transaction(async (tx) => {
      await tx.reward.update({ where: { id: rewardId }, data: { ...(delta === null ? data : { ...base, stock: { increment: delta } }), ...(imageAt !== undefined ? { imageAt } : {}) } });
      await tx.reward.updateMany({ where: { id: rewardId, stock: { lt: 0 } }, data: { stock: 0 } });
      if (photo) await tx.rewardImage.upsert({ where: { rewardId }, create: { rewardId, mime: "image/webp", data: photo }, update: { mime: "image/webp", data: photo } });
      if (removePhoto) await tx.rewardImage.deleteMany({ where: { rewardId } });
    });
  } else {
    const created = await db.reward.create({ data: { ...data, imageAt: imageAt ?? null, ...(photo ? { image: { create: { mime: "image/webp", data: photo } } } : {}) } });
    id = created.id;
  }
  await audit(admin.id, rewardId ? "REWARD_DIPERBARUI" : "REWARD_DIBUAT", "Reward", id ?? name, { ...data, ...(photo ? { foto: "diunggah" } : removePhoto ? { foto: "dihapus" } : {}) });
  revalidatePath("/admin/reward");
  revalidatePath("/poin");
  return { ok: true, message: tr("Katalog tersimpan.", "Catalogue saved.") };
}

export async function processRedemptionAction(id: string, status: "DIPROSES" | "SELESAI" | "DITOLAK", note: string): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const { tr } = await getTr();
  if (!["DIPROSES", "SELESAI", "DITOLAK"].includes(status)) return { ok: false, message: tr("Status tidak valid.", "Invalid status.") };
  const r = await db.redemption.findUnique({ where: { id }, include: { reward: true } });
  if (!r) return { ok: false, message: tr("Penukaran tidak ditemukan.", "Redemption not found.") };
  if (r.status === "SELESAI" || r.status === "DITOLAK") return { ok: false, message: tr("Penukaran sudah final.", "This redemption is already final.") };
  const changed = await db.$transaction(async (tx) => {
    const upd = await tx.redemption.updateMany({ where: { id, status: { in: ["DIAJUKAN", "DIPROSES"] } }, data: { status, note: note || null, processedById: admin.id, processedAt: new Date() } });
    if (upd.count !== 1) return false;
    if (status === "DITOLAK") {
      await tx.pointLedger.create({ data: { userId: r.userId, type: "PENYESUAIAN", points: r.pointsCost, note: `Pengembalian poin: ${r.reward.name} ditolak` } });
      await tx.reward.update({ where: { id: r.rewardId }, data: { stock: { increment: 1 } } });
    }
    return true;
  });
  if (!changed) return { ok: false, message: tr("Penukaran sudah diproses oleh admin lain.", "This redemption has already been processed by another admin.") };
  await notify(
    "POIN",
    [r.userId],
    bi(
      `Penukaran ${r.reward.name}: ${status === "SELESAI" ? "selesai" : status === "DIPROSES" ? "sedang diproses" : "ditolak"}`,
      `Redemption of ${r.reward.name}: ${status === "SELESAI" ? "completed" : status === "DIPROSES" ? "processing" : "rejected"}`,
    ),
    note ? bi(note, note) : undefined,
    "/poin",
  );
  await audit(admin.id, "PENUKARAN_DIPROSES", "Redemption", id, { status, note });
  revalidatePath("/admin/penukaran");
  return { ok: true, message: tr("Penukaran diperbarui.", "Redemption updated.") };
}

export async function adjustPointsAction(userId: string, points: number, note: string): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const { tr } = await getTr();
  if (!Number.isInteger(points) || points === 0) return { ok: false, message: tr("Nilai poin harus bilangan bulat bukan nol.", "Points must be a non-zero whole number.") };
  if (!note.trim()) return { ok: false, message: tr("Alasan penyesuaian wajib diisi.", "A reason for the adjustment is required.") };
  await db.pointLedger.create({ data: { userId, type: "PENYESUAIAN", points, note } });
  await notify("POIN", [userId], bi(`Penyesuaian poin ${points > 0 ? "+" : ""}${points}`, `Points adjustment ${points > 0 ? "+" : ""}${points}`), bi(note, note), "/poin");
  await audit(admin.id, "POIN_DISESUAIKAN", "User", userId, { points, note });
  revalidatePath("/admin/pengguna");
  return { ok: true, message: tr("Poin disesuaikan.", "Points adjusted.") };
}

export async function saveSettingsAction(fd: FormData): Promise<Result> {
  const user = await requireUser(["ADMIN", "MANAGER"]);
  const { tr } = await getTr();
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
    push: Object.fromEntries(NOTIF_TYPES.map((t) => [t, fd.get(`push_${t}`) === "on"])) as AppSettings["push"],
  };
  await saveSettings(next, user.id);
  await audit(user.id, "PENGATURAN_DIUBAH", "Setting", "alur", { before: cur, after: next });
  revalidatePath("/admin/pengaturan");
  return { ok: true, message: tr("Pengaturan tersimpan dan tercatat pada jejak audit.", "Settings saved and recorded in the audit trail.") };
}

export async function resetDataAction(fd: FormData): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const { lang, tr } = await getTr();
  if (admin.email?.endsWith(DEMO_DOMAIN)) return { ok: false, message: tr("Masuk dengan akun Google admin, bukan akun demo, karena akun demo ikut terhapus.", "Sign in with the admin Google account, not a demo account, because demo accounts are deleted too.") };
  if (String(fd.get("confirm") ?? "").trim().toUpperCase() !== "HAPUS DATA UJI") return { ok: false, message: tr("Ketik HAPUS DATA UJI untuk konfirmasi.", "Type HAPUS DATA UJI to confirm.") };
  const opts = {
    transactions: fd.get("transactions") === "on",
    demoUsers: fd.get("demoUsers") === "on",
    areaIds: fd.getAll("areaIds").map(String),
    rewardIds: fd.getAll("rewardIds").map(String),
    audit: fd.get("audit") === "on",
  };
  if (!opts.transactions && !opts.demoUsers && !opts.areaIds.length && !opts.rewardIds.length && !opts.audit) return { ok: false, message: tr("Pilih data yang akan dihapus.", "Select the data to delete.") };
  let done: Record<string, number>;
  try {
    done = await runReset(opts, tr);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : tr("Pembersihan gagal.", "Cleanup failed.") };
  }
  await audit(admin.id, "DATA_UJI_DIHAPUS", "Sistem", "data-uji", done);
  revalidatePath("/", "layout");
  const unitsId: Record<string, string> = { laporan: "laporan", poin: "catatan poin", penukaran: "penukaran", notifikasi: "notifikasi", konsultasi: "konsultasi", akunDemo: "akun demo", area: "area contoh", reward: "reward contoh", jejakAudit: "catatan audit" };
  const unitsEn: Record<string, string> = { laporan: "hazard reports", poin: "point records", penukaran: "redemptions", notifikasi: "notifications", konsultasi: "consultations", akunDemo: "demo accounts", area: "sample areas", reward: "sample rewards", jejakAudit: "audit records" };
  const units = lang === "en" ? unitsEn : unitsId;
  const parts = Object.entries(done).map(([k, v]) => `${v} ${units[k] ?? k}`);
  return { ok: true, message: tr(`Selesai. Terhapus: ${parts.join(", ")}.`, `Done. Deleted: ${parts.join(", ")}.`) };
}

/** Admin aktif yang tersisa bila akun-akun ini dihapus */
async function adminsLeft(ids: string[]) {
  return db.user.count({ where: { role: "ADMIN", status: "ACTIVE", id: { notIn: ids } } });
}

// Tanpa revalidatePath: daftar dimuat ulang oleh dialog setelah ditutup agar pesan hasil tetap terbaca
export async function deleteUserAction(userId: string): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const { lang, tr } = await getTr();
  if (userId === admin.id) return { ok: false, message: tr("Anda tidak dapat menghapus akun sendiri.", "You cannot delete your own account.") };
  const u = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, status: true, _count: { select: { bawahan: true } } } });
  if (!u) return { ok: false, message: tr("Pengguna tidak ditemukan atau sudah dihapus.", "User not found or already deleted.") };
  if (u.role === "ADMIN" && (await adminsLeft([u.id])) === 0) return { ok: false, message: tr("Admin aktif terakhir tidak dapat dihapus.", "The last active admin cannot be deleted.") };
  const dummy = isDummyEmail(u.email);
  if (!dummy) {
    const h = await userHistory(u.id);
    const desc = describeHistory(h, lang);
    if (desc)
      return {
        ok: false,
        message: tr(
          `Akun ini memiliki riwayat kerja (${desc}) yang menjadi bukti program K3, sehingga tidak dihapus. Ubah statusnya menjadi Nonaktif agar tidak dapat masuk lagi.`,
          `This account has a work history (${desc}) that serves as evidence for the OHS program, so it was not deleted. Change its status to Inactive to prevent further sign-in.`,
        ),
      };
  }
  const done = await purgeUsers([u.id]);
  await audit(admin.id, "PENGGUNA_DIHAPUS", "User", u.id, { name: u.name, email: u.email, role: u.role, dummy, laporanTerhapus: done.laporan });
  const sub = u._count.bawahan;
  const note = sub ? tr(` ${sub} bawahan kini tanpa atasan, tetapkan atasan baru.`, ` ${sub} subordinate${sub === 1 ? " now has" : "s now have"} no superior; assign a new one.`) : "";
  const withReports = done.laporan ? tr(` beserta ${done.laporan} laporannya`, ` along with ${done.laporan} of their hazard report${done.laporan === 1 ? "" : "s"}`) : "";
  return { ok: true, message: tr(`Akun ${u.name ?? u.email} dihapus${withReports}.${note}`, `Account ${u.name ?? u.email} deleted${withReports}.${note}`) };
}

export async function deleteDummyUsersAction(): Promise<Result> {
  const admin = await requireUser(["ADMIN"]);
  const { tr } = await getTr();
  if (isDummyEmail(admin.email)) return { ok: false, message: tr("Masuk dengan akun Google admin, bukan akun dummy, karena akun yang sedang dipakai ikut terhapus.", "Sign in with the admin Google account, not a dummy account, because the account in use would be deleted too.") };
  const users = await db.user.findMany({ where: { email: { endsWith: DEMO_DOMAIN } }, select: { id: true } });
  if (!users.length) return { ok: true, message: tr("Tidak ada akun dummy.", "There are no dummy accounts.") };
  const ids = users.map((u) => u.id);
  if ((await adminsLeft(ids)) === 0) return { ok: false, message: tr("Tidak ada admin aktif lain selain akun dummy. Aktifkan akun Google admin terlebih dahulu.", "There is no other active admin besides the dummy accounts. Activate an admin Google account first.") };
  const done = await purgeUsers(ids);
  await audit(admin.id, "AKUN_DUMMY_DIHAPUS", "User", undefined, { akun: done.users, laporan: done.laporan });
  return {
    ok: true,
    message: tr(
      `${done.users} akun dummy dihapus${done.laporan ? ` beserta ${done.laporan} laporannya` : ""}.`,
      `${done.users} dummy account${done.users === 1 ? "" : "s"} deleted${done.laporan ? ` along with ${done.laporan} of their hazard report${done.laporan === 1 ? "" : "s"}` : ""}.`,
    ),
  };
}
