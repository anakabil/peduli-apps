/* Data awal PEDULI Apps: akun demo, area kerja, katalog reward, laporan contoh. */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/constants";
import { placeholderPhotos } from "./placeholder-photos";

const db = new PrismaClient();

const DEMO = "@demo.peduli.local";

async function main() {
  // Pengaturan alur
  await db.setting.upsert({
    where: { key: "alur" },
    create: { key: "alur", value: JSON.stringify(DEFAULT_SETTINGS) },
    update: {},
  });

  // Area kerja (koordinat contoh di kawasan industri Cilegon, Banten; sesuaikan di menu Admin)
  const areas = [
    { code: "PRD", name: "Produksi", lat: -5.9955, lng: 106.0152, radiusM: 400 },
    { code: "GDG", name: "Gudang", lat: -5.9968, lng: 106.0178, radiusM: 300 },
    { code: "UTL", name: "Utilitas", lat: -5.9942, lng: 106.0131, radiusM: 250 },
    { code: "LOG", name: "Logistik", lat: -5.9980, lng: 106.0160, radiusM: 350 },
    { code: "KTR", name: "Perkantoran", lat: -5.9930, lng: 106.0165, radiusM: 200 },
  ];
  const areaMap: Record<string, string> = {};
  for (const a of areas) {
    const row = await db.area.upsert({ where: { code: a.code }, create: a, update: { name: a.name } });
    areaMap[a.code] = row.id;
  }

  // Akun demo dan laporan contoh hanya bila SEED_DEMO tidak "false"
  const withDemo = process.env.SEED_DEMO !== "false";
  if (!withDemo) {
    console.log("Seed master selesai (pengaturan, area, katalog reward). Akun demo dilewati.");
    return;
  }
  const mk = async (email: string, name: string, role: string, extra: Record<string, unknown> = {}) =>
    db.user.upsert({
      where: { email },
      create: { email, name, role, status: "ACTIVE", emailVerified: new Date(), ...extra },
      update: { name, role, status: "ACTIVE", ...extra },
    });

  const admin = await mk(`admin${DEMO}`, "Admin Program", "ADMIN", { jabatan: "Pengelola Program PEDULI", departemen: "HSE" });
  const direksi = await mk(`direksi${DEMO}`, "Hendra Wijaya", "DIREKSI", { jabatan: "Direktur Operasional", departemen: "Direksi" });
  const manager = await mk(`manager${DEMO}`, "Budi Santoso", "MANAGER", { jabatan: "Manager Produksi", departemen: "Produksi", areaId: areaMap.PRD });
  const manager2 = await mk(`manager2${DEMO}`, "Sri Lestari", "MANAGER", { jabatan: "Manager Gudang dan Logistik", departemen: "Supply Chain", areaId: areaMap.GDG });
  const supt = await mk(`superintendent${DEMO}`, "Agus Prasetyo", "SUPERINTENDENT", { jabatan: "Superintendent Produksi", departemen: "Produksi", areaId: areaMap.PRD, atasanId: manager.id });
  const supt2 = await mk(`superintendent2${DEMO}`, "Dewi Anggraini", "SUPERINTENDENT", { jabatan: "Superintendent Gudang", departemen: "Supply Chain", areaId: areaMap.GDG, atasanId: manager2.id });
  const pengawas = await mk(`pengawas${DEMO}`, "Rizky Firmansyah", "PENGAWAS", { jabatan: "Pengawas Shift A", departemen: "Produksi", areaId: areaMap.PRD, atasanId: supt.id, nik: "GYS-0101" });
  const pengawas2 = await mk(`pengawas2${DEMO}`, "Yuni Astuti", "PENGAWAS", { jabatan: "Pengawas Gudang", departemen: "Supply Chain", areaId: areaMap.GDG, atasanId: supt2.id, nik: "GYS-0102" });
  const pengawas3 = await mk(`pengawas3${DEMO}`, "Dani Kurniawan", "PENGAWAS", { jabatan: "Pengawas Utilitas", departemen: "Utilitas", areaId: areaMap.UTL, atasanId: supt.id, nik: "GYS-0103" });

  await db.area.update({ where: { code: "PRD" }, data: { managerId: manager.id } });
  await db.area.update({ where: { code: "UTL" }, data: { managerId: manager.id } });
  await db.area.update({ where: { code: "GDG" }, data: { managerId: manager2.id } });
  await db.area.update({ where: { code: "LOG" }, data: { managerId: manager2.id } });
  await db.area.update({ where: { code: "KTR" }, data: { managerId: manager.id } });

  // Katalog reward
  const rewards = [
    { name: "Payung", description: "Contoh hadiah tingkat awal", pointsCost: 10, stock: 50, tier: "AWAL", icon: "Umbrella" },
    { name: "Tumbler", description: "Contoh hadiah tingkat lanjut", pointsCost: 200, stock: 20, tier: "LANJUT", icon: "CupSoda" },
    { name: "Sepatu keselamatan", description: "Contoh hadiah tingkat menengah", pointsCost: 100, stock: 15, tier: "MENENGAH", icon: "Footprints" },
    { name: "Voucher belanja", description: "Senilai Rp100.000", pointsCost: 60, stock: 30, tier: "MENENGAH", icon: "Ticket" },
  ];
  if ((await db.reward.count()) === 0) await db.reward.createMany({ data: rewards });

  // Laporan contoh (hanya bila belum ada)
  if ((await db.report.count()) > 0) {
    console.log("Laporan contoh sudah ada, dilewati.");
    return;
  }

  const cats = ["KONDISI_TIDAK_AMAN", "TINDAKAN_TIDAK_AMAN", "NYARIS_CELAKA", "ERGONOMI", "LINGKUNGAN"];
  const risks = ["RENDAH", "SEDANG", "SEDANG", "TINGGI", "EKSTREM"];
  const descs = [
    "Kabel terkelupas dekat jalur forklift.",
    "Pekerja tidak memakai kacamata pelindung saat menggerinda.",
    "Tumpukan coil hampir jatuh saat dipindahkan crane.",
    "Posisi kerja membungkuk terlalu lama di meja inspeksi.",
    "Ceceran oli hidrolik di lantai dekat mesin potong.",
    "Pagar pengaman mezanin lepas satu sisi.",
    "Lampu penerangan area bongkar muat padam.",
    "APAR terhalang tumpukan pallet.",
    "Tangga portabel retak pada anak tangga ketiga.",
    "Debu logam menumpuk di saluran ventilasi.",
  ];
  const reporters = [pengawas, pengawas2, pengawas3, pengawas, pengawas2, supt, manager2, pengawas3, pengawas, direksi];
  const areaCodes = ["PRD", "GDG", "UTL", "PRD", "GDG", "PRD", "LOG", "KTR", "PRD", "PRD"];
  const now = new Date();
  const photos = await placeholderPhotos();
  let seq = 0;
  const monthsBack = [0, 0, 0, 1, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  for (let i = 0; i < 48; i++) {
    const mb = monthsBack[i % monthsBack.length];
    const created = new Date(now.getFullYear(), now.getMonth() - mb, Math.max(1, (i * 7) % 27), 8 + (i % 9), (i * 13) % 60);
    if (created > now) created.setTime(now.getTime() - i * 3600000);
    const reporter = reporters[i % reporters.length];
    const code = areaCodes[i % areaCodes.length];
    const area = areas.find((a) => a.code === code)!;
    const category = cats[i % cats.length];
    const riskLevel = risks[(i * 3) % risks.length];
    const path = reporter.role === "PENGAWAS" ? "A" : "B";
    seq++;
    const ym = `${created.getFullYear()}${String(created.getMonth() + 1).padStart(2, "0")}`;
    const number = `PDL-${ym}-${String(seq).padStart(4, "0")}`;

    // Tentukan status berdasarkan umur laporan
    const ageDays = (now.getTime() - created.getTime()) / 86400000;
    let status = "MENUNGGU_VERIFIKASI";
    if (path === "B") status = "MENUNGGU_KEPUTUSAN";
    if (ageDays > 2) status = "MENUNGGU_KEPUTUSAN";
    if (ageDays > 5) status = "DALAM_PERBAIKAN";
    if (ageDays > 12) status = "MENUNGGU_PENUTUPAN";
    if (ageDays > 18) status = "SELESAI";
    if (i % 11 === 10) status = "DITOLAK";
    if (i % 17 === 16 && ageDays < 18) status = "PERLU_REVISI";

    const verifier = reporter.atasanId === supt.id ? supt : supt2;
    const decider = ["PRD", "UTL", "KTR"].includes(code) ? manager : manager2;
    const verified = path === "A" && !["MENUNGGU_VERIFIKASI", "PERLU_REVISI"].includes(status);
    const decided = ["DALAM_PERBAIKAN", "MENUNGGU_PENUTUPAN", "SELESAI"].includes(status);
    const closed = status === "SELESAI";
    const verifiedAt = verified ? new Date(created.getTime() + (6 + (i % 30)) * 3600000) : null;
    const decidedAt = decided ? new Date((verifiedAt ?? created).getTime() + (12 + (i % 40)) * 3600000) : null;
    const targetDate = decidedAt ? new Date(decidedAt.getTime() + (5 + (i % 10)) * 86400000) : null;
    const closedAt = closed && decidedAt ? new Date(decidedAt.getTime() + (3 + (i % 14)) * 86400000) : null;
    const closedOnTime = closedAt && targetDate ? closedAt <= targetDate : null;
    const highRisk = riskLevel === "TINGGI" || riskLevel === "EKSTREM";
    let pointsAwarded = 0;
    if (verified || (path === "B" && decided)) {
      pointsAwarded = category === "NYARIS_CELAKA" ? 3 : 2;
      if (highRisk) pointsAwarded += 3;
    }

    const report = await db.report.create({
      data: {
        number,
        reporterId: reporter.id,
        path,
        areaId: areaMap[code],
        areaLabel: `${area.name} - titik ${1 + (i % 6)}`,
        category,
        riskLevel,
        description: descs[i % descs.length],
        suggestion: i % 3 === 0 ? "Pasang penutup pelindung dan beri tanda peringatan." : null,
        lat: area.lat + ((i % 5) - 2) * 0.0004,
        lng: area.lng + ((i % 7) - 3) * 0.0004,
        accuracyM: 4 + (i % 9),
        createdAt: created,
        status,
        escalated: highRisk && path === "A",
        dueVerifyAt: new Date(created.getTime() + 2 * 86400000),
        dueDecideAt: new Date((verifiedAt ?? created).getTime() + 3 * 86400000),
        verifierId: verified ? verifier.id : null,
        verifiedAt,
        verificationResult: verified ? "VALID" : status === "PERLU_REVISI" ? "REVISI" : null,
        verificationNote: verified ? "Foto sesuai lokasi dan waktu, uraian jelas." : null,
        deciderId: decided || status === "DITOLAK" ? decider.id : null,
        decidedAt: decidedAt ?? (status === "DITOLAK" ? new Date(created.getTime() + 86400000) : null),
        decisionResult: decided ? "SETUJU" : status === "DITOLAK" ? "TOLAK" : null,
        decisionNote: decided ? "Disetujui, segera ditindaklanjuti." : status === "DITOLAK" ? "Laporan ganda dengan laporan sebelumnya." : null,
        picId: decided ? (code === "GDG" || code === "LOG" ? supt2.id : supt.id) : null,
        picName: decided ? (code === "GDG" || code === "LOG" ? "Superintendent Gudang" : "Superintendent Produksi") : null,
        resourceTenaga: decided ? "2 teknisi" : null,
        resourceBiaya: decided ? "Rp1.500.000" : null,
        resourceMaterial: decided ? "Material pelindung dan rambu" : null,
        targetDate,
        controlHierarchy: decided ? ["REKAYASA_TEKNIK", "ADMINISTRATIF", "APD", "SUBSTITUSI", "ELIMINASI"][i % 5] : null,
        progressPct: closed ? 100 : status === "MENUNGGU_PENUTUPAN" ? 100 : status === "DALAM_PERBAIKAN" ? 40 : 0,
        completedAt: closed || status === "MENUNGGU_PENUTUPAN" ? new Date((decidedAt ?? created).getTime() + 2 * 86400000) : null,
        closerId: closed ? decider.id : null,
        closedAt,
        closedOnTime,
        closureNote: closed ? "Hasil perbaikan diverifikasi di lapangan." : null,
        suggestionApplied: closed && i % 3 === 0,
        pointsAwarded,
        isDuplicate: status === "DITOLAK",
        photos: { create: { mime: "image/jpeg", data: photos[i % photos.length], size: photos[i % photos.length].length, width: 960, height: 720, kind: "LAPORAN" } },
      },
    });

    const events: Array<{ type: string; actorId: string; createdAt: Date; note?: string; fromStatus?: string; toStatus?: string }> = [
      { type: "DIBUAT", actorId: reporter.id, createdAt: created, toStatus: path === "A" ? "MENUNGGU_VERIFIKASI" : "MENUNGGU_KEPUTUSAN" },
    ];
    if (verified && verifiedAt) events.push({ type: "DIVERIFIKASI", actorId: verifier.id, createdAt: verifiedAt, fromStatus: "MENUNGGU_VERIFIKASI", toStatus: "MENUNGGU_KEPUTUSAN", note: "Valid" });
    if (decidedAt) events.push({ type: "DIPUTUSKAN", actorId: decider.id, createdAt: decidedAt, toStatus: "DALAM_PERBAIKAN", note: "Setujui" });
    if (closedAt) events.push({ type: "DITUTUP", actorId: decider.id, createdAt: closedAt, fromStatus: "MENUNGGU_PENUTUPAN", toStatus: "SELESAI" });
    for (const e of events) await db.reportEvent.create({ data: { reportId: report.id, ...e } });

    if (pointsAwarded > 0) {
      await db.pointLedger.create({
        data: { userId: reporter.id, reportId: report.id, type: category === "NYARIS_CELAKA" ? "NYARIS_CELAKA" : "LAPORAN_VALID", points: category === "NYARIS_CELAKA" ? 3 : 2, note: number, createdAt: verifiedAt ?? decidedAt ?? created },
      });
      if (highRisk) await db.pointLedger.create({ data: { userId: reporter.id, reportId: report.id, type: "BONUS_RISIKO", points: 3, note: number, createdAt: verifiedAt ?? decidedAt ?? created } });
    }
  }

  // Sinkronkan pencacah nomor laporan dengan data contoh
  const maxPerMonth = new Map<string, number>();
  for (const r of await db.report.findMany({ select: { number: true } })) {
    const m = r.number.match(/^PDL-(\d{6})-(\d+)$/);
    if (m) maxPerMonth.set(m[1], Math.max(maxPerMonth.get(m[1]) ?? 0, Number(m[2])));
  }
  for (const [ym, value] of maxPerMonth) await db.counter.upsert({ where: { key: `report:${ym}` }, create: { key: `report:${ym}`, value }, update: { value } });

  await db.auditLog.create({ data: { actorId: admin.id, action: "SEED", detail: JSON.stringify({ users: 9, reports: 48 }) } });
  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
