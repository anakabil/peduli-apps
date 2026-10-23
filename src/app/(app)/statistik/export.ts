"use client";

import type { SerializedStats } from "./dashboard";
import { INDICATORS, REJECT_STAGE_LABEL, REJECT_REASON_STAT_LABEL } from "./dashboard";
import { CATEGORIES, CATEGORY_SHORT, CATEGORY_LABEL, RISK_LABEL, STATUS_LABEL, CONTROL_LABEL, ROLE_LABEL, HAZARD_TYPE_LABEL, COMPANY_NAME, type Category, type Risk, type Status, type Control, type Role, type HazardType } from "@/lib/constants";

export type ExportCtx = { stats: SerializedStats; periodLabel: string; areaName: string | null; preparedBy: string; images: Record<string, string | null> };

const BRAND = "#006042";
const BRAND2 = "#0a785b";
const INK = "#14211c";
const MUTED = "#67766e";

async function loadImage(url: string): Promise<{ data: string; w: number; h: number }> {
  const res = await fetch(url);
  const blob = await res.blob();
  const data = await new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
  const dims = await new Promise<{ w: number; h: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = data;
  });
  return { data, ...dims };
}

function fileStamp(label: string) {
  return `PEDULI-Statistik-${label.replace(/[^a-z0-9]+/gi, "-")}-${new Date().toISOString().slice(0, 10)}`;
}

function kpiRows(s: SerializedStats["summary"]) {
  return [
    ["Laporan masuk", `${s.total}`, `${s.prevTotal} periode sebelumnya`],
    ["Laporan valid / ditolak", `${s.valid} / ${s.rejected}`, ""],
    ["Partisipasi pelapor", `${s.participation}%`, `${s.reporters} dari ${s.activeUsers} pengguna aktif`],
    ["Waktu respons verifikasi", `${s.verifyHours} jam`, "rerata jalur A"],
    ["Waktu keputusan Manager", `${s.decideHours} jam`, "rerata"],
    ["Waktu penutupan rerata", `${s.closureDays} hari`, `${s.prevClosureDays} hari periode sebelumnya`],
    ["Penutupan tepat waktu", `${s.onTime}%`, `${s.closedInPeriod} laporan ditutup`],
    ["Risiko tinggi masih terbuka", `${s.highOpen}`, `${s.overdueOpen} lewat target`],
    ["Laporan berulang", `${s.recurringPct}%`, `${s.recurring} laporan`],
    ["Eskalasi otomatis", `${s.escalated}`, "risiko Tinggi/Ekstrem"],
    ["Laporan di luar area kerja", `${s.outsideArea}`, "perlu tinjauan"],
    ["Poin diberikan", `${s.pointsAwarded}`, `${s.suggestionApplied} dari ${s.withSuggestion} usulan diterapkan`],
  ];
}

const rejectRow = (r: SerializedStats["rejectedList"][number]) => [
  r.number,
  r.area,
  REJECT_STAGE_LABEL[r.stage],
  REJECT_REASON_STAT_LABEL[r.reason ?? "LAINNYA"] ?? REJECT_REASON_STAT_LABEL.LAINNYA,
  r.by,
  r.at ? new Date(r.at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }) : "-",
];

// ---------------- PDF ----------------
export async function exportPdf(ctx: ExportCtx) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const { stats, periodLabel, areaName, preparedBy, images } = ctx;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const [peduli, gys] = await Promise.all([loadImage("/brand/peduli-logo-sm.png"), loadImage("/brand/gys-logo.png")]);
  const scope = areaName ? `Area ${areaName}` : "Seluruh area";
  let page = 0;

  const header = (title: string) => {
    page++;
    if (page > 1) doc.addPage();
    doc.addImage(gys.data, "PNG", M, 10, 12, 12);
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK).text(COMPANY_NAME, M + 15, 15);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(MUTED).text("Program PEDULI: Pelaporan Bahaya dan Upaya Pengendalian", M + 15, 19.5);
    const lw = 34;
    doc.addImage(peduli.data, "PNG", W - M - lw, 9, lw, lw * (peduli.h / peduli.w));
    doc.setDrawColor(BRAND).setLineWidth(0.6).line(M, 26, W - M, 26);
    doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(BRAND).text(title, M, 34);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(MUTED).text(`Periode ${periodLabel} | ${scope}`, M, 39.5);
  };
  const footer = () => {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5).setTextColor(MUTED);
      // Teks kiri dibatasi lebarnya agar tidak menimpa nomor halaman di kanan
      doc.text(`Disusun oleh ${preparedBy}, ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB.`, M, H - 8, { maxWidth: W - 2 * M - 62 });
      doc.text(`Developed by Nusa Safety | Halaman ${i} dari ${n}`, W - M, H - 8, { align: "right" });
    }
  };
  const img = (key: string, x: number, y: number, w: number, h: number, caption?: string) => {
    const d = images[key];
    if (!d) return;
    doc.setFillColor("#ffffff").setDrawColor("#e3e9e5").roundedRect(x, y, w, h + (caption ? 6 : 0), 2, 2, "FD");
    if (caption) doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(INK).text(caption, x + 3, y + 5);
    doc.addImage(d, "PNG", x + 2, y + (caption ? 7 : 2), w - 4, h - 4);
  };

  // Halaman 1: ringkasan
  header("Ringkasan kondisi program");
  const s = stats.summary;
  const tiles = [
    ["Laporan masuk", `${s.total}`, s.deltaTotalPct != null ? `${s.deltaTotalPct > 0 ? "+" : ""}${s.deltaTotalPct}% dari periode sebelumnya` : "belum ada pembanding"],
    ["Partisipasi pelapor", `${s.participation}%`, `${s.reporters} dari ${s.activeUsers} pengguna`],
    ["Waktu penutupan rerata", `${s.closureDays} hari`, `${s.prevClosureDays} hari sebelumnya`],
    ["Penutupan tepat waktu", `${s.onTime}%`, `${s.closedInPeriod} ditutup`],
    ["Risiko tinggi terbuka", `${s.highOpen}`, `${s.overdueOpen} lewat target`],
  ];
  const tw = (W - 2 * M - 4 * 3) / 5;
  tiles.forEach((t, i) => {
    const x = M + i * (tw + 3);
    doc.setFillColor(i === 4 && s.highOpen > 0 ? "#fbeaea" : "#f2faf6").setDrawColor("#e3e9e5").roundedRect(x, 44, tw, 24, 2, 2, "FD");
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(MUTED).text(t[0], x + 3, 49);
    doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(i === 4 && s.highOpen > 0 ? "#c8373b" : BRAND).text(t[1], x + 3, 58);
    doc.setFont("helvetica", "normal").setFontSize(6.5).setTextColor(MUTED).text(doc.splitTextToSize(t[2], tw - 6), x + 3, 63);
  });
  img("trend", M, 72, W - 2 * M, 70, "Tren laporan masuk, valid, dan ditutup (12 bulan)");
  const half = (W - 2 * M - 4) / 2;
  img("risk", M, 152, half, 62, "Sebaran tingkat risiko");
  img("category", M + half + 4, 152, half, 62, "Kategori bahaya");
  autoTable(doc, {
    startY: 224,
    margin: { left: M, right: M },
    head: [["Indikator", "Nilai", "Keterangan"]],
    body: kpiRows(s),
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    headStyles: { fillColor: BRAND, textColor: "#ffffff" },
    alternateRowStyles: { fillColor: "#f7f9f8" },
  });

  // Halaman 2: analitik area
  header("Area rawan dan kinerja tindak lanjut");
  autoTable(doc, {
    startY: 44,
    margin: { left: M, right: M },
    head: [["Area", ...CATEGORIES.map((c) => CATEGORY_SHORT[c]), "Total"]],
    body: stats.heatmap.map((h) => [h.area, ...h.cells.map(String), String(h.total)]),
    styles: { fontSize: 8, halign: "center", cellPadding: 2 },
    columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
    headStyles: { fillColor: BRAND, textColor: "#ffffff" },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index > 0 && data.column.index <= CATEGORIES.length) {
        const v = Number(data.cell.raw);
        const t = v / Math.max(1, stats.heatMax);
        data.cell.styles.fillColor = v === 0 ? "#f2faf6" : t < 0.25 ? "#bfe3d4" : t < 0.5 ? "#f2d98a" : t < 0.75 ? "#f0a85a" : "#e0656a";
        if (t >= 0.75 && v > 0) data.cell.styles.textColor = "#ffffff";
      }
    },
  });
  type DocWithTable = typeof doc & { lastAutoTable?: { finalY: number } };
  let y = ((doc as DocWithTable).lastAutoTable?.finalY ?? 100) + 6;
  img("aging", M, y, half, 55, "Umur tindak lanjut yang masih terbuka");
  img("onTime", M + half + 4, y, half, 55, "Penutupan tepat waktu per area (12 bulan)");
  y += 66;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: W / 2 + 2 },
    head: [["Area", "Laporan", "Tinggi+", "Terbuka"]],
    body: stats.byArea.map((a) => [a.area, a.total, a.tinggi, a.terbuka]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });
  autoTable(doc, {
    startY: y,
    margin: { left: W / 2 + 2, right: M },
    head: [["Status", "Jumlah"]],
    body: stats.statusDist.map((c) => [STATUS_LABEL[c.key as Status], c.count]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });
  y = ((doc as DocWithTable).lastAutoTable?.finalY ?? y) + 8;
  if (stats.highOpenList.length) {
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK).text("Risiko tinggi terbuka", M, y);
    autoTable(doc, {
      startY: y + 3,
      margin: { left: M, right: M },
      head: [["Nomor", "Area", "Kategori", "Risiko", "Status", "Umur (hari)"]],
      body: stats.highOpenList.map((r) => [r.number, r.area, CATEGORY_LABEL[r.category], RISK_LABEL[r.riskLevel], STATUS_LABEL[r.status as Status], r.days]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: "#c8373b", textColor: "#ffffff" },
    });
  }

  // Laporan ditolak tetap dilaporkan untuk menjaga objektivitas
  header("Jenis bahaya dan laporan ditolak");
  autoTable(doc, {
    startY: 44,
    margin: { left: M, right: W / 2 + 2 },
    head: [["Jenis bahaya", "Jumlah"]],
    body: stats.hazardTypeDist.map((c) => [HAZARD_TYPE_LABEL[c.key as HazardType], c.count]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });
  autoTable(doc, {
    startY: 44,
    margin: { left: W / 2 + 2, right: M },
    head: [["Ditolak menurut tahap dan alasan", "Jumlah"]],
    body: [...stats.rejectedByStage.map((r) => [`Tahap ${REJECT_STAGE_LABEL[r.key]}`, r.count]), ...stats.rejectedByReason.map((r) => [REJECT_REASON_STAT_LABEL[r.key], r.count])],
    styles: { fontSize: 8 },
    headStyles: { fillColor: "#c8373b", textColor: "#ffffff" },
  });
  y = ((doc as DocWithTable).lastAutoTable?.finalY ?? 80) + 8;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK).text(`Daftar laporan ditolak (${stats.rejectedList.length})`, M, y);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: M, right: M },
    head: [["Nomor", "Area", "Tahap", "Alasan", "Oleh", "Tanggal"]],
    body: stats.rejectedList.length ? stats.rejectedList.map(rejectRow) : [["Tidak ada laporan ditolak pada periode ini.", "", "", "", "", ""]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });

  // Halaman 3: partisipasi dan indikator
  header("Partisipasi, pengendalian, dan kamus indikator");
  autoTable(doc, {
    startY: 44,
    margin: { left: M, right: W / 2 + 2 },
    head: [["Peran", "Pengguna", "Melapor", "%"]],
    body: stats.participationByRole.map((p) => [ROLE_LABEL[p.role as Role], p.users, p.reporters, `${p.pct}%`]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });
  autoTable(doc, {
    startY: 44,
    margin: { left: W / 2 + 2, right: M },
    head: [["Hierarki pengendalian", "Jumlah"]],
    body: stats.controlDist.map((c) => [CONTROL_LABEL[c.key as Control], c.count]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });
  y = ((doc as DocWithTable).lastAutoTable?.finalY ?? 80) + 8;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK).text("Pelapor teratas dalam periode", M, y);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: M, right: M },
    head: [["Nama", "Peran", "Departemen", "Laporan", "Valid", "Poin"]],
    body: stats.topReporters.map((r) => [r.name, ROLE_LABEL[r.role as Role], r.departemen ?? "-", r.laporan, r.valid, r.poin]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND, textColor: "#ffffff" },
  });
  y = ((doc as DocWithTable).lastAutoTable?.finalY ?? y) + 8;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK).text("Kamus indikator", M, y);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: M, right: M },
    head: [["Indikator", "Rumus", "Dasar keputusan"]],
    body: INDICATORS.map((i) => [i.k, i.f, i.d]),
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: BRAND, textColor: "#ffffff" },
  });
  footer();
  doc.save(`${fileStamp(periodLabel)}.pdf`);
}

// ---------------- PPTX ----------------
export async function exportPptx(ctx: ExportCtx) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const { stats, periodLabel, areaName, preparedBy, images } = ctx;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = `Statistik PEDULI ${periodLabel}`;
  pptx.company = COMPANY_NAME;
  const scope = areaName ? `Area ${areaName}` : "Seluruh area";
  const [peduli, gys] = await Promise.all([loadImage("/brand/peduli-logo-sm.png"), loadImage("/brand/gys-logo.png")]);

  const master = (title: string, sub?: string) => {
    const slide = pptx.addSlide();
    slide.background = { color: "F4F7F5" };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: "006042" } });
    slide.addImage({ data: gys.data, x: 0.35, y: 0.22, w: 0.5, h: 0.5 });
    slide.addText(COMPANY_NAME, { x: 0.95, y: 0.2, w: 5, h: 0.3, fontSize: 10, bold: true, color: "14211C", fontFace: "Calibri" });
    slide.addText("Program PEDULI: Pelaporan Bahaya dan Upaya Pengendalian", { x: 0.95, y: 0.45, w: 5.5, h: 0.25, fontSize: 8, color: "67766E", fontFace: "Calibri" });
    slide.addImage({ data: peduli.data, x: 8.1, y: 0.18, w: 1.6, h: 1.6 * (peduli.h / peduli.w) });
    slide.addText(title, { x: 0.35, y: 0.85, w: 7.5, h: 0.45, fontSize: 20, bold: true, color: "006042", fontFace: "Calibri" });
    slide.addText(sub ?? `Periode ${periodLabel} | ${scope}`, { x: 0.35, y: 1.25, w: 9, h: 0.28, fontSize: 10, color: "67766E", fontFace: "Calibri" });
    slide.addText(`Developed by Nusa Safety | Disusun oleh ${preparedBy}`, { x: 0.35, y: 5.25, w: 9.3, h: 0.25, fontSize: 7.5, color: "8D9A93", align: "right", fontFace: "Calibri" });
    return slide;
  };
  const s = stats.summary;

  // Slide 1: judul
  const cover = pptx.addSlide();
  cover.background = { color: "006042" };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 5.625, fill: { type: "solid", color: "006042" } });
  cover.addShape(pptx.ShapeType.ellipse, { x: 6.8, y: -1.2, w: 5, h: 5, fill: { color: "0A785B", transparency: 60 }, line: { color: "0A785B", transparency: 100 } });
  cover.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 0.6, w: 2.4, h: 1.05, fill: { color: "FFFFFF" }, rectRadius: 0.1, line: { color: "FFFFFF" } });
  cover.addImage({ data: peduli.data, x: 0.7, y: 0.66, w: 2.2, h: 2.2 * (peduli.h / peduli.w) });
  cover.addText("STATISTIK PROGRAM PEDULI", { x: 0.6, y: 2.0, w: 8.5, h: 0.4, fontSize: 12, color: "BFE3D4", bold: true, charSpacing: 3, fontFace: "Calibri" });
  cover.addText(`Kondisi aktual pelaporan bahaya\n${periodLabel}`, { x: 0.6, y: 2.4, w: 8.5, h: 1.3, fontSize: 30, bold: true, color: "FFFFFF", fontFace: "Calibri" });
  cover.addText(`${COMPANY_NAME} | ${scope}`, { x: 0.6, y: 3.8, w: 8.5, h: 0.35, fontSize: 13, color: "E3F3EC", fontFace: "Calibri" });
  // Logo GYS transparan, diberi kartu putih agar tulisan abu-abunya terbaca di latar hijau
  cover.addShape(pptx.ShapeType.roundRect, { x: 0.55, y: 4.35, w: 0.7, h: 0.7, fill: { color: "FFFFFF" }, rectRadius: 0.08, line: { color: "FFFFFF" } });
  cover.addImage({ data: gys.data, x: 0.6, y: 4.4, w: 0.6, h: 0.6 });
  cover.addText(`Disusun oleh ${preparedBy}, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}\nDeveloped by Nusa Safety`, { x: 1.3, y: 4.4, w: 7, h: 0.6, fontSize: 9, color: "BFE3D4", fontFace: "Calibri" });

  // Slide 2: ringkasan KPI
  const s2 = master("Kondisi aktual program PEDULI");
  const tiles = [
    ["Laporan masuk", `${s.total}`, s.deltaTotalPct != null ? `${s.deltaTotalPct > 0 ? "+" : ""}${s.deltaTotalPct}% dari periode lalu` : "belum ada pembanding"],
    ["Partisipasi pelapor", `${s.participation}%`, `${s.reporters} dari ${s.activeUsers} pengguna`],
    ["Waktu penutupan rerata", `${s.closureDays} hari`, `${s.prevClosureDays} hari periode lalu`],
    ["Penutupan tepat waktu", `${s.onTime}%`, `${s.closedInPeriod} laporan ditutup`],
    ["Risiko tinggi terbuka", `${s.highOpen}`, `${s.overdueOpen} lewat target`],
  ];
  tiles.forEach((t, i) => {
    const x = 0.35 + i * 1.86;
    const bad = i === 4 && s.highOpen > 0;
    s2.addShape(pptx.ShapeType.roundRect, { x, y: 1.65, w: 1.75, h: 1.2, fill: { color: bad ? "5B2A3A" : "0A5C47" }, rectRadius: 0.08, line: { color: bad ? "5B2A3A" : "0A5C47" } });
    s2.addText(t[0], { x: x + 0.1, y: 1.72, w: 1.6, h: 0.3, fontSize: 8.5, color: "BFE3D4", fontFace: "Calibri" });
    s2.addText(t[1], { x: x + 0.1, y: 2.0, w: 1.6, h: 0.5, fontSize: 24, bold: true, color: bad ? "FFD166" : "FFFFFF", fontFace: "Calibri" });
    s2.addText(t[2], { x: x + 0.1, y: 2.5, w: 1.6, h: 0.3, fontSize: 7.5, color: "7CC7AD", fontFace: "Calibri" });
  });
  s2.addChart(pptx.ChartType.line, [
    { name: "Masuk", labels: stats.trend.map((t) => t.label), values: stats.trend.map((t) => t.masuk) },
    { name: "Ditutup", labels: stats.trend.map((t) => t.label), values: stats.trend.map((t) => t.ditutup) },
  ], { x: 0.35, y: 3.0, w: 5.6, h: 2.15, chartColors: ["0A785B", "C9A227"], lineSize: 2, lineDataSymbol: "circle", lineDataSymbolSize: 5, showLegend: true, legendPos: "t", legendFontSize: 8, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, showTitle: true, title: "Tren laporan masuk dan ditutup", titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });
  s2.addChart(pptx.ChartType.doughnut, [{ name: "Risiko", labels: stats.riskDist.map((r) => RISK_LABEL[r.key as Risk]), values: stats.riskDist.map((r) => r.count) }], { x: 6.1, y: 3.0, w: 3.55, h: 2.15, chartColors: ["2E9E6B", "D9A520", "E07A1F", "C8373B"], holeSize: 60, showPercent: true, showLegend: true, legendPos: "r", legendFontSize: 8, showTitle: true, title: "Sebaran tingkat risiko", titleFontSize: 10, titleColor: "14211C", dataLabelFontSize: 8 });

  // Slide 3: peta panas dan tindak lanjut
  const s3 = master("Area rawan dan kinerja tindak lanjut");
  const heatRows = [
    [{ text: "Area", options: { bold: true, color: "FFFFFF", fill: { color: "006042" } } }, ...CATEGORIES.map((c) => ({ text: CATEGORY_SHORT[c], options: { bold: true, color: "FFFFFF", fill: { color: "006042" }, align: "center" as const } }))],
    ...stats.heatmap.map((h) => [
      { text: h.area, options: { bold: true } },
      ...h.cells.map((v) => {
        const t = v / Math.max(1, stats.heatMax);
        const fill = v === 0 ? "F2FAF6" : t < 0.25 ? "BFE3D4" : t < 0.5 ? "F2D98A" : t < 0.75 ? "F0A85A" : "E0656A";
        return { text: String(v), options: { align: "center" as const, bold: true, fill: { color: fill }, color: t >= 0.75 && v > 0 ? "FFFFFF" : "14211C" } };
      }),
    ]),
  ];
  s3.addTable(heatRows, { x: 0.35, y: 1.65, w: 5.3, fontSize: 9, fontFace: "Calibri", border: { type: "solid", color: "FFFFFF", pt: 1 }, rowH: 0.36, colW: [1.3, 0.8, 0.8, 0.8, 0.8, 0.8] });
  s3.addText("Warna makin hangat menandakan jumlah laporan makin banyak.", { x: 0.35, y: 4.1, w: 5.3, h: 0.3, fontSize: 8, color: "67766E", italic: true, fontFace: "Calibri" });
  s3.addChart(pptx.ChartType.bar, [{ name: "Laporan", labels: stats.aging.map((a) => a.label), values: stats.aging.map((a) => a.count) }], { x: 5.85, y: 1.6, w: 3.8, h: 1.75, barDir: "bar", chartColors: ["0A785B"], showValue: true, dataLabelFontSize: 8, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, showTitle: true, title: "Umur tindak lanjut yang masih terbuka", titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });
  s3.addChart(pptx.ChartType.bar, [{ name: "% tepat waktu", labels: stats.onTimeByArea.map((a) => a.area), values: stats.onTimeByArea.map((a) => a.pct) }], { x: 5.85, y: 3.4, w: 3.8, h: 1.8, barDir: "bar", chartColors: ["C9A227"], showValue: true, dataLabelFontSize: 8, dataLabelFormatCode: '0"%"', valAxisMaxVal: 100, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, showTitle: true, title: "Penutupan tepat waktu per area", titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });

  // Slide 4: kategori, status, hierarki
  const s4 = master("Kategori, status, dan hierarki pengendalian");
  s4.addChart(pptx.ChartType.bar, [{ name: "Laporan", labels: stats.categoryDist.map((c) => CATEGORY_SHORT[c.key as Category]), values: stats.categoryDist.map((c) => c.count) }], { x: 0.35, y: 1.65, w: 3.1, h: 3.4, chartColors: ["0A785B"], showValue: true, dataLabelFontSize: 8, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, showTitle: true, title: "Kategori bahaya", titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });
  s4.addChart(pptx.ChartType.bar, [{ name: "Laporan", labels: stats.statusDist.map((c) => STATUS_LABEL[c.key as Status]), values: stats.statusDist.map((c) => c.count) }], { x: 3.55, y: 1.65, w: 3.1, h: 3.4, barDir: "bar", chartColors: ["2B6CB0"], showValue: true, dataLabelFontSize: 8, catAxisLabelFontSize: 7, valAxisLabelFontSize: 8, showTitle: true, title: "Status laporan", titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });
  s4.addChart(pptx.ChartType.doughnut, [{ name: "Pengendalian", labels: stats.controlDist.map((c) => CONTROL_LABEL[c.key as Control]), values: stats.controlDist.map((c) => c.count) }], { x: 6.75, y: 1.65, w: 2.9, h: 3.4, chartColors: ["0A785B", "C9A227", "2B6CB0", "E07A1F", "7C3AED"], holeSize: 55, showPercent: true, showLegend: true, legendPos: "b", legendFontSize: 8, dataLabelFontSize: 8, showTitle: true, title: "Hierarki pengendalian", titleFontSize: 10, titleColor: "14211C" });

  // Slide 5: tabel indikator dan partisipasi
  const s5 = master("Indikator kinerja dan partisipasi");
  const hdr = (t: string) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: "006042" } } });
  s5.addTable([[hdr("Indikator"), hdr("Nilai"), hdr("Keterangan")], ...kpiRows(s).map((r) => [{ text: r[0] }, { text: r[1], options: { bold: true, color: "006042" } }, { text: r[2], options: { color: "67766E" } }])], { x: 0.35, y: 1.65, w: 5.6, fontSize: 8.5, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [2.1, 1.0, 2.5], rowH: 0.26 });
  s5.addTable([[hdr("Peran"), hdr("Pengguna"), hdr("Melapor"), hdr("%")], ...stats.participationByRole.map((p) => [{ text: ROLE_LABEL[p.role as Role] }, { text: String(p.users) }, { text: String(p.reporters) }, { text: `${p.pct}%`, options: { bold: true } }])], { x: 6.15, y: 1.65, w: 3.5, fontSize: 8.5, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [1.4, 0.7, 0.7, 0.7], rowH: 0.26 });
  s5.addTable([[hdr("Pelapor teratas"), hdr("Laporan"), hdr("Valid"), hdr("Poin")], ...stats.topReporters.slice(0, 6).map((r) => [{ text: r.name }, { text: String(r.laporan) }, { text: String(r.valid) }, { text: String(r.poin), options: { bold: true, color: "006042" } }])], { x: 6.15, y: 3.15, w: 3.5, fontSize: 8.5, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [1.7, 0.6, 0.6, 0.6], rowH: 0.26 });

  // Slide 6: risiko tinggi terbuka
  if (stats.highOpenList.length) {
    const s6 = master("Risiko tinggi terbuka", "Diurutkan dari yang paling lama.");
    s6.addTable([[hdr("Nomor"), hdr("Area"), hdr("Kategori"), hdr("Risiko"), hdr("Status"), hdr("Umur (hari)")], ...stats.highOpenList.map((r) => [{ text: r.number }, { text: r.area }, { text: CATEGORY_LABEL[r.category] }, { text: RISK_LABEL[r.riskLevel], options: { bold: true, color: r.riskLevel === "EKSTREM" ? "C8373B" : "E07A1F" } }, { text: STATUS_LABEL[r.status as Status] }, { text: String(r.days), options: { bold: true, color: r.days > 14 ? "C8373B" : "14211C" } }])], { x: 0.35, y: 1.65, w: 9.3, fontSize: 9, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [1.6, 1.3, 2.0, 1.0, 2.2, 1.2], rowH: 0.3 });
  }

  // Slide laporan ditolak: tetap ditampilkan agar keputusan penolakan dapat ditelaah
  const sR = master("Jenis bahaya dan laporan ditolak", `${stats.summary.rejected} laporan ditolak dalam periode.`);
  sR.addChart(pptx.ChartType.bar, [{ name: "Laporan", labels: stats.hazardTypeDist.map((c) => HAZARD_TYPE_LABEL[c.key as HazardType]), values: stats.hazardTypeDist.map((c) => c.count) }], { x: 0.35, y: 1.65, w: 3.6, h: 3.4, barDir: "bar", chartColors: ["0A785B"], showValue: true, dataLabelFontSize: 8, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, showTitle: true, title: "Jenis bahaya", titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });
  sR.addTable(
    [
      [hdr("Nomor"), hdr("Area"), hdr("Tahap"), hdr("Alasan"), hdr("Oleh")],
      ...(stats.rejectedList.length
        ? stats.rejectedList.slice(0, 10).map((r) => rejectRow(r).slice(0, 5).map((t) => ({ text: String(t) })))
        : [[{ text: "Tidak ada laporan ditolak." }, { text: "" }, { text: "" }, { text: "" }, { text: "" }]]),
    ],
    { x: 4.15, y: 1.65, w: 5.5, fontSize: 8, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [1.3, 0.9, 0.9, 1.4, 1.0], rowH: 0.26 },
  );

  // Slide 7: kamus indikator
  const s7 = master("Kamus indikator", "Indikator objektif untuk dasar kebijakan.");
  s7.addTable([[hdr("Indikator"), hdr("Rumus"), hdr("Dasar keputusan")], ...INDICATORS.map((i) => [{ text: i.k, options: { bold: true } }, { text: i.f }, { text: i.d, options: { color: "67766E" } }])], { x: 0.35, y: 1.65, w: 9.3, fontSize: 9, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [2.2, 4.0, 3.1], rowH: 0.4 });

  // Lampiran: tangkapan grafik dari dashboard (bila tersedia)
  if (images.trend) {
    const s8 = master("Lampiran: grafik dashboard");
    s8.addImage({ data: images.trend, x: 0.35, y: 1.65, w: 5.6, h: 2.3 });
    if (images.risk) s8.addImage({ data: images.risk, x: 6.1, y: 1.65, w: 3.5, h: 2.3 });
    if (images.aging) s8.addImage({ data: images.aging, x: 0.35, y: 4.05, w: 4.6, h: 1.1 });
    if (images.onTime) s8.addImage({ data: images.onTime, x: 5.1, y: 4.05, w: 4.55, h: 1.1 });
  }

  await pptx.writeFile({ fileName: `${fileStamp(periodLabel)}.pptx` });
}

// ---------------- CSV ----------------
export function exportCsv(ctx: ExportCtx) {
  const { stats, periodLabel, areaName } = ctx;
  const rows: string[][] = [];
  rows.push(["Statistik PEDULI", periodLabel, areaName ?? "Seluruh area"]);
  rows.push([]);
  rows.push(["Indikator", "Nilai", "Keterangan"]);
  kpiRows(stats.summary).forEach((r) => rows.push(r));
  rows.push([]);
  rows.push(["Bulan", "Masuk", "Valid", "Ditutup"]);
  stats.trend.forEach((t) => rows.push([t.label, String(t.masuk), String(t.valid), String(t.ditutup)]));
  rows.push([]);
  rows.push(["Area", ...CATEGORIES.map((c) => CATEGORY_LABEL[c]), "Total"]);
  stats.heatmap.forEach((h) => rows.push([h.area, ...h.cells.map(String), String(h.total)]));
  rows.push([]);
  rows.push(["Risiko", "Jumlah"]);
  stats.riskDist.forEach((r) => rows.push([RISK_LABEL[r.key as Risk], String(r.count)]));
  rows.push([]);
  rows.push(["Status", "Jumlah"]);
  stats.statusDist.forEach((r) => rows.push([STATUS_LABEL[r.key as Status], String(r.count)]));
  rows.push([]);
  rows.push(["Jenis bahaya", "Jumlah"]);
  stats.hazardTypeDist.forEach((r) => rows.push([HAZARD_TYPE_LABEL[r.key as HazardType], String(r.count)]));
  rows.push([]);
  rows.push(["Laporan ditolak", "Area", "Tahap", "Alasan", "Oleh", "Tanggal"]);
  stats.rejectedList.forEach((r) => rows.push(rejectRow(r)));
  rows.push([]);
  rows.push(["Umur tindak lanjut terbuka", "Jumlah"]);
  stats.aging.forEach((a) => rows.push([a.label, String(a.count)]));
  rows.push([]);
  rows.push(["Area", "Penutupan tepat waktu (%)", "Jumlah ditutup"]);
  stats.onTimeByArea.forEach((a) => rows.push([a.area, String(a.pct), String(a.n)]));
  rows.push([]);
  rows.push(["Pelapor", "Peran", "Departemen", "Laporan", "Valid", "Poin"]);
  stats.topReporters.forEach((r) => rows.push([r.name, ROLE_LABEL[r.role as Role], r.departemen ?? "", String(r.laporan), String(r.valid), String(r.poin)]));
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${fileStamp(periodLabel)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
