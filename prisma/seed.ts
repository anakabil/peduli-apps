/* Data awal PEDULI Apps: akun demo, area kerja, katalog reward, laporan contoh. */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/constants";
import { placeholderPhotos } from "./placeholder-photos";
import { addBusinessDays } from "../src/lib/format";
import { ensureDemoAccounts, ensureSampleRewards, SAMPLE_AREAS } from "../src/lib/demo-accounts";

const db = new PrismaClient();


async function main() {
  // Pengaturan alur
  await db.setting.upsert({
    where: { key: "alur" },
    create: { key: "alur", value: JSON.stringify(DEFAULT_SETTINGS) },
    update: {},
  });

  // Area kerja (koordinat contoh di kawasan industri Cilegon, Banten; sesuaikan di menu Admin)
  const areas = SAMPLE_AREAS.map((a) => ({ ...a }));
  const areaMap: Record<string, string> = {};
  for (const a of areas) {
    const row = await db.area.upsert({ where: { code: a.code }, create: a, update: { name: a.name } });
    areaMap[a.code] = row.id;
  }

  // Katalog reward
  await ensureSampleRewards(db);

  // Akun demo dan laporan contoh hanya bila SEED_DEMO tidak "false"
  const withDemo = process.env.SEED_DEMO !== "false";
  if (!withDemo) {
    console.log("Seed master selesai (pengaturan, area, katalog reward). Akun demo dilewati.");
    return;
  }
  const { users: u } = await ensureDemoAccounts(db, { overwrite: true });
  const admin = u.admin, direksi = u.direksi, manager = u.manager, manager2 = u.manager2;
  const supt = u.superintendent, supt2 = u.superintendent2, pengawas = u.pengawas, pengawas2 = u.pengawas2, pengawas3 = u.pengawas3;

  // Laporan contoh (hanya bila belum ada)
  if ((await db.report.count()) > 0) {
    console.log("Laporan contoh sudah ada, dilewati.");
    return;
  }
  await seedReports({ admin, direksi, manager, manager2, supt, supt2, pengawas, pengawas2, pengawas3, areaMap, areas });
}

type U = { id: string; role: string; atasanId: string | null };

/**
 * Laporan contoh disimulasikan melewati tahap alur kerja berdasarkan waktu, sehingga status, stempel waktu,
 * jejak event, dan buku poin selalu konsisten dengan aturan aplikasi:
 * jalur A = Pengawas (verifikasi Superintendent, poin saat valid); jalur B = peran lain (langsung Manager, poin saat disetujui).
 */
async function seedReports(ctx: {
  admin: U; direksi: U; manager: U; manager2: U; supt: U; supt2: U; pengawas: U; pengawas2: U; pengawas3: U;
  areaMap: Record<string, string>;
  areas: Array<{ code: string; name: string; lat: number; lng: number }>;
}) {
  const { manager, manager2, supt, supt2, pengawas, pengawas2, pengawas3, direksi, areaMap, areas } = ctx;
  const P = DEFAULT_SETTINGS.points;
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
  const reporters: U[] = [pengawas, pengawas2, pengawas3, pengawas, pengawas2, supt, manager2, pengawas3, pengawas, direksi];
  const areaCodes = ["PRD", "GDG", "UTL", "PRD", "GDG", "PRD", "LOG", "KTR", "PRD", "PRD"];
  const controls = ["REKAYASA_TEKNIK", "ADMINISTRATIF", "APD", "SUBSTITUSI", "ELIMINASI"];
  const photos = await placeholderPhotos();
  const now = new Date();
  const H = 3600000;
  const D = 86400000;
  const counters = new Map<string, number>();
  const monthsBack = [0, 0, 0, 1, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  for (let i = 0; i < 48; i++) {
    const reporter = reporters[i % reporters.length];
    const path = reporter.role === "PENGAWAS" ? "A" : "B";
    const code = areaCodes[i % areaCodes.length];
    const area = areas.find((a) => a.code === code)!;
    const category = cats[i % cats.length];
    const riskLevel = risks[(i * 3) % risks.length];
    const highRisk = riskLevel === "TINGGI" || riskLevel === "EKSTREM";
    const verifier = reporter.atasanId === supt2.id ? supt2 : supt;
    const decider = ["PRD", "UTL", "KTR"].includes(code) ? manager : manager2;
    // Peninjauan sejawat: Manager tidak memutuskan laporannya sendiri
    const deciderFinal = decider.id === reporter.id ? (decider.id === manager.id ? manager2 : manager) : decider;
    const picUser = code === "GDG" || code === "LOG" ? supt2 : supt;

    // Waktu pembuatan (WIB pagi-sore) tidak melewati saat ini
    const mb = monthsBack[i % monthsBack.length];
    const created = new Date(now.getFullYear(), now.getMonth() - mb, Math.max(1, (i * 7) % 27), 1 + (i % 9), (i * 13) % 60);
    if (created > now) created.setTime(now.getTime() - (i + 1) * 5 * H);

    // Skenario: tolak (ganda), revisi, atau alur normal
    const rejectDup = i % 11 === 10;
    const askRevision = path === "A" && !rejectDup && i % 17 === 16;

    // Rencana stempel waktu per tahap
    const verifiedAt = path === "A" ? new Date(created.getTime() + (6 + (i % 30)) * H) : null;
    const decidedAt = new Date((verifiedAt ?? created).getTime() + (12 + (i % 40)) * H);
    const targetDate = new Date(decidedAt.getTime() + (5 + (i % 10)) * D);
    const completedAt = new Date(decidedAt.getTime() + (3 + (i % 14)) * D);
    const closedAt = new Date(completedAt.getTime() + D);
    const reached = (t: Date | null) => !!t && t <= now;

    type Ev = { type: string; actorId?: string; fromStatus?: string; toStatus: string; note?: string; createdAt: Date };
    const events: Ev[] = [];
    const ledger: Array<{ type: string; points: number; createdAt: Date }> = [];
    const r: Record<string, unknown> = {};
    let status = path === "A" ? "MENUNGGU_VERIFIKASI" : "MENUNGGU_KEPUTUSAN";
    events.push({ type: "DIBUAT", actorId: reporter.id, toStatus: status, createdAt: created });
    const escalated = path === "A" && highRisk;
    if (escalated) events.push({ type: "DIESKALASI", toStatus: status, note: "Eskalasi otomatis risiko Tinggi/Ekstrem ke Manager", createdAt: created });
    let points = 0;
    const award = (at: Date) => {
      const base = category === "NYARIS_CELAKA" ? P.nearMiss : P.valid;
      ledger.push({ type: category === "NYARIS_CELAKA" ? "NYARIS_CELAKA" : "LAPORAN_VALID", points: base, createdAt: at });
      points += base;
      if (highRisk) {
        ledger.push({ type: "BONUS_RISIKO", points: P.highRiskBonus, createdAt: at });
        points += P.highRiskBonus;
      }
    };

    if (path === "A" && reached(verifiedAt)) {
      const res = rejectDup ? "TOLAK" : askRevision ? "REVISI" : "VALID";
      const to = res === "VALID" ? "MENUNGGU_KEPUTUSAN" : res === "REVISI" ? "PERLU_REVISI" : "DITOLAK";
      Object.assign(r, { verifierId: verifier.id, verifiedAt, verificationResult: res, verificationNote: res === "VALID" ? "Foto sesuai lokasi dan waktu, uraian jelas." : res === "REVISI" ? "Foto kurang jelas, mohon ambil ulang dari sudut lain." : "Laporan ganda dengan laporan sebelumnya." });
      if (res === "REVISI") r.revisionCount = 1;
      if (res === "TOLAK") r.isDuplicate = true;
      events.push({ type: res === "VALID" ? "DIVERIFIKASI" : res === "REVISI" ? "DIREVISI" : "DITOLAK", actorId: verifier.id, fromStatus: status, toStatus: to, note: String(r.verificationNote), createdAt: verifiedAt! });
      status = to;
      if (res === "VALID") award(verifiedAt!);
    }

    if (status === "MENUNGGU_KEPUTUSAN" && reached(decidedAt)) {
      if (rejectDup) {
        Object.assign(r, { deciderId: deciderFinal.id, decidedAt, decisionResult: "TOLAK", decisionNote: "Laporan ganda dengan laporan sebelumnya.", isDuplicate: true });
        events.push({ type: "DITOLAK", actorId: deciderFinal.id, fromStatus: status, toStatus: "DITOLAK", note: "Laporan ganda dengan laporan sebelumnya.", createdAt: decidedAt });
        status = "DITOLAK";
      } else {
        Object.assign(r, {
          deciderId: deciderFinal.id, decidedAt, decisionResult: "SETUJU", decisionNote: "Disetujui, segera ditindaklanjuti.",
          picId: picUser.id, picName: picUser.id === supt2.id ? "Superintendent Gudang" : "Superintendent Produksi",
          resourceTenaga: "2 teknisi", resourceBiaya: "Rp1.500.000", resourceMaterial: "Material pelindung dan rambu",
          targetDate, controlHierarchy: controls[i % controls.length],
        });
        events.push({ type: "DIPUTUSKAN", actorId: deciderFinal.id, fromStatus: status, toStatus: "DALAM_PERBAIKAN", note: "Setujui.", createdAt: decidedAt });
        status = "DALAM_PERBAIKAN";
        if (path === "B") award(decidedAt);
        r.progressPct = 40;
      }
    }

    if (status === "DALAM_PERBAIKAN" && reached(completedAt)) {
      Object.assign(r, { progressPct: 100, completedAt, completionNote: "Perbaikan selesai dikerjakan." });
      events.push({ type: "SELESAI_PERBAIKAN", actorId: picUser.id, fromStatus: status, toStatus: "MENUNGGU_PENUTUPAN", note: "100% - Perbaikan selesai dikerjakan.", createdAt: completedAt });
      status = "MENUNGGU_PENUTUPAN";
    }

    let suggestionApplied = false;
    if (status === "MENUNGGU_PENUTUPAN" && reached(closedAt)) {
      Object.assign(r, { closerId: deciderFinal.id, closedAt, closureNote: "Hasil perbaikan diverifikasi di lapangan.", closedOnTime: completedAt <= targetDate });
      events.push({ type: "DITUTUP", actorId: deciderFinal.id, fromStatus: status, toStatus: "SELESAI", note: "Hasil perbaikan diverifikasi di lapangan.", createdAt: closedAt });
      status = "SELESAI";
      if (i % 3 === 0) {
        suggestionApplied = true;
        ledger.push({ type: "BONUS_USULAN", points: P.suggestionBonus, createdAt: closedAt });
        points += P.suggestionBonus;
      }
    }

    // Nomor laporan per bulan WIB
    const wib = new Date(created.getTime() + 7 * H);
    const ym = `${wib.getUTCFullYear()}${String(wib.getUTCMonth() + 1).padStart(2, "0")}`;
    const seq = (counters.get(ym) ?? 0) + 1;
    counters.set(ym, seq);
    const number = `PDL-${ym}-${String(seq).padStart(4, "0")}`;
    const photo = photos[i % photos.length];

    const report = await db.report.create({
      data: {
        number,
        reporterId: reporter.id,
        path,
        areaId: areaMap[code],
        areaLabel: `Titik ${1 + (i % 6)}`,
        category,
        riskLevel,
        description: descs[i % descs.length],
        suggestion: i % 3 === 0 ? "Pasang penutup pelindung dan beri tanda peringatan." : null,
        suggestionApplied,
        lat: area.lat + ((i % 5) - 2) * 0.0004,
        lng: area.lng + ((i % 7) - 3) * 0.0004,
        accuracyM: 4 + (i % 9),
        createdAt: created,
        status,
        escalated,
        dueVerifyAt: path === "A" ? addBusinessDays(created, DEFAULT_SETTINGS.verifyDeadlineDays) : null,
        dueDecideAt: path === "B" || r.verificationResult === "VALID" ? addBusinessDays((r.verifiedAt as Date | undefined) ?? created, DEFAULT_SETTINGS.decideDeadlineDays) : null,
        pointsAwarded: points,
        ...r,
        photos: { create: { mime: "image/jpeg", data: photo, size: photo.length, width: 960, height: 720, kind: "LAPORAN" } },
        events: { create: events },
      },
    });
    if (ledger.length) {
      await db.pointLedger.createMany({ data: ledger.map((l) => ({ ...l, userId: reporter.id, reportId: report.id, note: number })) });
    }
  }

  // Sinkronkan pencacah nomor laporan dengan data contoh
  for (const [ym, value] of counters) await db.counter.upsert({ where: { key: `report:${ym}` }, create: { key: `report:${ym}`, value }, update: { value } });
  await db.auditLog.create({ data: { actorId: ctx.admin.id, action: "SEED", detail: JSON.stringify({ users: 9, reports: 48 }) } });
  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
