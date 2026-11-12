"use client";

import type { SerializedStats } from "./dashboard";
import { indicators, rejectStageLabel, rejectReasonStatLabel } from "./dashboard";
import { CATEGORIES, labels, COMPANY_NAME, type Category, type Risk, type Status, type Control, type Role, type HazardType } from "@/lib/constants";
import type { Lang, Tr } from "@/lib/i18n";

/** Berkas ekspor mengikuti bahasa yang dipilih pengguna (lang dan tr dari dashboard) */
export type ExportCtx = { stats: SerializedStats; periodLabel: string; areaName: string | null; preparedBy: string; images: Record<string, string | null>; lang: Lang; tr: Tr };

const locale = (lang: Lang) => (lang === "en" ? "en-GB" : "id-ID");
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

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

function fileStamp(label: string, tr: Tr) {
  return `PEDULI-${tr("Statistik", "Statistics")}-${label.replace(/[^a-z0-9]+/gi, "-")}-${new Date().toISOString().slice(0, 10)}`;
}

function kpiRows(s: SerializedStats["summary"], tr: Tr) {
  return [
    [tr("Laporan masuk", "Reports received"), `${s.total}`, tr(`${s.prevTotal} periode sebelumnya`, `${s.prevTotal} in the previous period`)],
    [tr("Laporan valid / ditolak", "Valid / rejected reports"), `${s.valid} / ${s.rejected}`, ""],
    [tr("Partisipasi pelapor", "Reporter participation"), `${s.participation}%`, tr(`${s.reporters} dari ${s.activeUsers} pengguna aktif`, `${s.reporters} of ${s.activeUsers} active users`)],
    [tr("Waktu respons verifikasi", "Verification response time"), tr(`${s.verifyHours} jam`, `${s.verifyHours} hours`), tr("rerata jalur A", "path A average")],
    [tr("Waktu keputusan Manager", "Manager decision time"), tr(`${s.decideHours} jam`, `${s.decideHours} hours`), tr("rerata", "average")],
    [tr("Waktu penutupan rerata", "Average closure time"), tr(`${s.closureDays} hari`, `${s.closureDays} days`), tr(`${s.prevClosureDays} hari periode sebelumnya`, `${s.prevClosureDays} days in the previous period`)],
    [tr("Penutupan tepat waktu", "On-time closure"), `${s.onTime}%`, tr(`${s.closedInPeriod} laporan ditutup`, `${s.closedInPeriod} ${plural(s.closedInPeriod, "report", "reports")} closed`)],
    [tr("Risiko tinggi masih terbuka", "Open high-risk items"), `${s.highOpen}`, tr(`${s.overdueOpen} lewat target`, `${s.overdueOpen} past target date`)],
    [tr("Laporan berulang", "Repeat reports"), `${s.recurringPct}%`, tr(`${s.recurring} laporan`, `${s.recurring} ${plural(s.recurring, "report", "reports")}`)],
    [tr("Eskalasi otomatis", "Automatic escalation"), `${s.escalated}`, tr("risiko Tinggi/Ekstrem", "High/Extreme risk")],
    [tr("Laporan di luar area kerja", "Reports outside work area"), `${s.outsideArea}`, tr("perlu tinjauan", "review needed")],
    [tr("Poin diberikan", "Points awarded"), `${s.pointsAwarded}`, tr(`${s.suggestionApplied} dari ${s.withSuggestion} usulan diterapkan`, `${s.suggestionApplied} of ${s.withSuggestion} suggested actions implemented`)],
  ];
}

const rejectRow = (r: SerializedStats["rejectedList"][number], lang: Lang) => {
  const stage = rejectStageLabel(lang);
  const reason = rejectReasonStatLabel(lang);
  return [r.number, r.area, stage[r.stage], reason[r.reason ?? "LAINNYA"] ?? reason.LAINNYA, r.by, r.at ? new Date(r.at).toLocaleDateString(locale(lang), { timeZone: "Asia/Jakarta" }) : "-"];
};

// ---------------- PDF ----------------
export async function exportPdf(ctx: ExportCtx) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const { stats, periodLabel, areaName, preparedBy, images, lang, tr } = ctx;
  const L = labels(lang);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const [peduli, gys] = await Promise.all([loadImage("/brand/peduli-logo-sm.png"), loadImage("/brand/gys-logo.png")]);
  const scope = areaName ? `Area ${areaName}` : tr("Seluruh area", "All areas");
  const tagline = tr("Program PEDULI: Pelaporan Bahaya dan Upaya Pengendalian", "PEDULI Program: Hazard Reporting and Control Measures");
  let page = 0;

  const header = (title: string) => {
    page++;
    if (page > 1) doc.addPage();
    doc.addImage(gys.data, "PNG", M, 10, 12, 12);
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK).text(COMPANY_NAME, M + 15, 15);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(MUTED).text(tagline, M + 15, 19.5);
    const lw = 34;
    doc.addImage(peduli.data, "PNG", W - M - lw, 9, lw, lw * (peduli.h / peduli.w));
    doc.setDrawColor(BRAND).setLineWidth(0.6).line(M, 26, W - M, 26);
    doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(BRAND).text(title, M, 34);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(MUTED).text(`${tr("Periode", "Period")} ${periodLabel} | ${scope}`, M, 39.5);
  };
  const footer = () => {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5).setTextColor(MUTED);
      // Teks kiri dibatasi lebarnya agar tidak menimpa nomor halaman di kanan
      const at = new Date().toLocaleString(locale(lang), { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });
      doc.text(tr(`Disusun oleh ${preparedBy}, ${at} WIB.`, `Prepared by ${preparedBy}, ${at} WIB.`), M, H - 8, { maxWidth: W - 2 * M - 62 });
      doc.text(`Developed by Nusa Safety | ${tr(`Halaman ${i} dari ${n}`, `Page ${i} of ${n}`)}`, W - M, H - 8, { align: "right" });
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
  header(tr("Ringkasan kondisi program", "Program status summary"));
  const s = stats.summary;
  const dPct = s.deltaTotalPct != null ? `${s.deltaTotalPct > 0 ? "+" : ""}${s.deltaTotalPct}%` : null;
  const tiles = [
    [tr("Laporan masuk", "Reports received"), `${s.total}`, dPct ? tr(`${dPct} dari periode sebelumnya`, `${dPct} vs previous period`) : tr("belum ada pembanding", "no comparison yet")],
    [tr("Partisipasi pelapor", "Reporter participation"), `${s.participation}%`, tr(`${s.reporters} dari ${s.activeUsers} pengguna`, `${s.reporters} of ${s.activeUsers} users`)],
    [tr("Waktu penutupan rerata", "Average closure time"), tr(`${s.closureDays} hari`, `${s.closureDays} days`), tr(`${s.prevClosureDays} hari sebelumnya`, `${s.prevClosureDays} days previously`)],
    [tr("Penutupan tepat waktu", "On-time closure"), `${s.onTime}%`, tr(`${s.closedInPeriod} ditutup`, `${s.closedInPeriod} closed`)],
    [tr("Risiko tinggi terbuka", "Open high-risk items"), `${s.highOpen}`, tr(`${s.overdueOpen} lewat target`, `${s.overdueOpen} past target date`)],
  ];
  const tw = (W - 2 * M - 4 * 3) / 5;
  tiles.forEach((t, i) => {
    const x = M + i * (tw + 3);
    doc.setFillColor(i === 4 && s.highOpen > 0 ? "#fbeaea" : "#f2faf6").setDrawColor("#e3e9e5").roundedRect(x, 44, tw, 24, 2, 2, "FD");
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(MUTED).text(t[0], x + 3, 49);
    doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(i === 4 && s.highOpen > 0 ? "#c8373b" : BRAND).text(t[1], x + 3, 58);
    doc.setFont("helvetica", "normal").setFontSize(6.5).setTextColor(MUTED).text(doc.splitTextToSize(t[2], tw - 6), x + 3, 63);
  });
  img("trend", M, 72, W - 2 * M, 70, tr("Tren laporan masuk, valid, dan ditutup (12 bulan)", "Trend of reports received, valid, and closed (12 months)"));
  const half = (W - 2 * M - 4) / 2;
  img("risk", M, 152, half, 62, tr("Sebaran tingkat risiko", "Risk level distribution"));
  img("category", M + half + 4, 152, half, 62, tr("Jenis bahaya", "Hazard type"));
  autoTable(doc, {
    startY: 224,
    margin: { left: M, right: M },
    head: [[tr("Indikator", "Indicator"), tr("Nilai", "Value"), tr("Keterangan", "Notes")]],
    body: kpiRows(s, tr),
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    headStyles: { fillColor: BRAND, textColor: "#ffffff" },
    alternateRowStyles: { fillColor: "#f7f9f8" },
  });

  // Halaman 2: analitik area
  header(tr("Area rawan dan kinerja tindak lanjut", "High-risk areas and follow-up performance"));
  autoTable(doc, {
    startY: 44,
    margin: { left: M, right: M },
    head: [["Area", ...CATEGORIES.map((c) => L.CATEGORY_SHORT[c]), "Total"]],
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
  img("aging", M, y, half, 55, tr("Umur tindak lanjut yang masih terbuka", "Age of open follow-ups"));
  img("onTime", M + half + 4, y, half, 55, tr("Penutupan tepat waktu per area (12 bulan)", "On-time closure by area (12 months)"));
  y += 66;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: W / 2 + 2 },
    head: [["Area", tr("Laporan", "Reports"), tr("Tinggi+", "High+"), tr("Terbuka", "Open")]],
    body: stats.byArea.map((a) => [a.area, a.total, a.tinggi, a.terbuka]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });
  autoTable(doc, {
    startY: y,
    margin: { left: W / 2 + 2, right: M },
    head: [["Status", tr("Jumlah", "Count")]],
    body: stats.statusDist.map((c) => [L.STATUS_LABEL[c.key as Status], c.count]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });
  y = ((doc as DocWithTable).lastAutoTable?.finalY ?? y) + 8;
  if (stats.highOpenList.length) {
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK).text(tr("Risiko tinggi terbuka", "Open high-risk items"), M, y);
    autoTable(doc, {
      startY: y + 3,
      margin: { left: M, right: M },
      head: [[tr("Nomor", "Number"), "Area", tr("Jenis bahaya", "Hazard type"), tr("Risiko", "Risk"), "Status", tr("Umur (hari)", "Age (days)")]],
      body: stats.highOpenList.map((r) => [r.number, r.area, L.CATEGORY_LABEL[r.category], L.RISK_LABEL[r.riskLevel], L.STATUS_LABEL[r.status as Status], r.days]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: "#c8373b", textColor: "#ffffff" },
    });
  }

  // Laporan ditolak tetap dilaporkan untuk menjaga objektivitas
  header(tr("Sumber bahaya dan laporan ditolak", "Hazard sources and rejected reports"));
  autoTable(doc, {
    startY: 44,
    margin: { left: M, right: W / 2 + 2 },
    head: [[tr("Sumber bahaya", "Hazard source"), tr("Jumlah", "Count")]],
    body: stats.hazardTypeDist.map((c) => [L.HAZARD_TYPE_LABEL[c.key as HazardType], c.count]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });
  autoTable(doc, {
    startY: 44,
    margin: { left: W / 2 + 2, right: M },
    head: [[tr("Ditolak menurut tahap dan alasan", "Rejected by stage and reason"), tr("Jumlah", "Count")]],
    body: [...stats.rejectedByStage.map((r) => [tr(`Tahap ${rejectStageLabel(lang)[r.key]}`, `${rejectStageLabel(lang)[r.key]} stage`), r.count]), ...stats.rejectedByReason.map((r) => [rejectReasonStatLabel(lang)[r.key], r.count])],
    styles: { fontSize: 8 },
    headStyles: { fillColor: "#c8373b", textColor: "#ffffff" },
  });
  y = ((doc as DocWithTable).lastAutoTable?.finalY ?? 80) + 8;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK).text(tr(`Daftar laporan ditolak (${stats.rejectedList.length})`, `Rejected reports (${stats.rejectedList.length})`), M, y);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: M, right: M },
    head: [[tr("Nomor", "Number"), "Area", tr("Tahap", "Stage"), tr("Alasan", "Reason"), tr("Oleh", "By"), tr("Tanggal", "Date")]],
    body: stats.rejectedList.length ? stats.rejectedList.map((r) => rejectRow(r, lang)) : [[tr("Tidak ada laporan ditolak pada periode ini.", "No rejected reports in this period."), "", "", "", "", ""]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });

  // Halaman 3: partisipasi dan indikator
  header(tr("Partisipasi, pengendalian, dan kamus indikator", "Participation, controls, and indicator glossary"));
  autoTable(doc, {
    startY: 44,
    margin: { left: M, right: W / 2 + 2 },
    head: [[tr("Peran", "Role"), tr("Pengguna", "Users"), tr("Melapor", "Reported"), "%"]],
    body: stats.participationByRole.map((p) => [L.ROLE_LABEL[p.role as Role], p.users, p.reporters, `${p.pct}%`]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });
  autoTable(doc, {
    startY: 44,
    margin: { left: W / 2 + 2, right: M },
    head: [[tr("Hierarki pengendalian", "Hierarchy of controls"), tr("Jumlah", "Count")]],
    body: stats.controlDist.map((c) => [L.CONTROL_LABEL[c.key as Control], c.count]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND2, textColor: "#ffffff" },
  });
  y = ((doc as DocWithTable).lastAutoTable?.finalY ?? 80) + 8;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK).text(tr(`Klasemen pelapor (${stats.reporterRanking.length} pelapor, urut jumlah laporan)`, `Reporter leaderboard (${stats.reporterRanking.length} ${plural(stats.reporterRanking.length, "reporter", "reporters")}, sorted by number of reports)`), M, y);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: M, right: M },
    head: [["#", tr("Nama", "Name"), tr("Jabatan", "Position"), "Area", tr("Laporan", "Reports"), "Valid", tr("Tinggi+", "High+"), tr("Poin", "Points")]],
    body: stats.reporterRanking.map((r) => [r.rank, r.name, r.jabatan || L.ROLE_LABEL[r.role as Role], r.area ?? "-", r.laporan, r.valid, r.tinggi, r.poin]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: BRAND, textColor: "#ffffff" },
  });
  y = ((doc as DocWithTable).lastAutoTable?.finalY ?? y) + 8;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK).text(tr("Kamus indikator", "Indicator glossary"), M, y);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: M, right: M },
    head: [[tr("Indikator", "Indicator"), tr("Rumus", "Formula"), tr("Dasar keputusan", "Decision basis")]],
    body: indicators(tr).map((i) => [i.k, i.f, i.d]),
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: BRAND, textColor: "#ffffff" },
  });
  footer();
  doc.save(`${fileStamp(periodLabel, tr)}.pdf`);
}

// ---------------- PPTX ----------------
export async function exportPptx(ctx: ExportCtx) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const { stats, periodLabel, areaName, preparedBy, images, lang, tr } = ctx;
  const L = labels(lang);
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = tr(`Statistik PEDULI ${periodLabel}`, `PEDULI Statistics ${periodLabel}`);
  pptx.company = COMPANY_NAME;
  const scope = areaName ? `Area ${areaName}` : tr("Seluruh area", "All areas");
  const [peduli, gys] = await Promise.all([loadImage("/brand/peduli-logo-sm.png"), loadImage("/brand/gys-logo.png")]);

  const master = (title: string, sub?: string) => {
    const slide = pptx.addSlide();
    slide.background = { color: "F4F7F5" };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: "006042" } });
    slide.addImage({ data: gys.data, x: 0.35, y: 0.22, w: 0.5, h: 0.5 });
    slide.addText(COMPANY_NAME, { x: 0.95, y: 0.2, w: 5, h: 0.3, fontSize: 10, bold: true, color: "14211C", fontFace: "Calibri" });
    slide.addText(tr("Program PEDULI: Pelaporan Bahaya dan Upaya Pengendalian", "PEDULI Program: Hazard Reporting and Control Measures"), { x: 0.95, y: 0.45, w: 5.5, h: 0.25, fontSize: 8, color: "67766E", fontFace: "Calibri" });
    slide.addImage({ data: peduli.data, x: 8.1, y: 0.18, w: 1.6, h: 1.6 * (peduli.h / peduli.w) });
    slide.addText(title, { x: 0.35, y: 0.85, w: 7.5, h: 0.45, fontSize: 20, bold: true, color: "006042", fontFace: "Calibri" });
    slide.addText(sub ?? `${tr("Periode", "Period")} ${periodLabel} | ${scope}`, { x: 0.35, y: 1.25, w: 9, h: 0.28, fontSize: 10, color: "67766E", fontFace: "Calibri" });
    slide.addText(`Developed by Nusa Safety | ${tr("Disusun oleh", "Prepared by")} ${preparedBy}`, { x: 0.35, y: 5.25, w: 9.3, h: 0.25, fontSize: 7.5, color: "8D9A93", align: "right", fontFace: "Calibri" });
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
  cover.addText(tr("STATISTIK PROGRAM PEDULI", "PEDULI PROGRAM STATISTICS"), { x: 0.6, y: 2.0, w: 8.5, h: 0.4, fontSize: 12, color: "BFE3D4", bold: true, charSpacing: 3, fontFace: "Calibri" });
  cover.addText(tr(`Kondisi aktual pelaporan bahaya\n${periodLabel}`, `Current status of hazard reporting\n${periodLabel}`), { x: 0.6, y: 2.4, w: 8.5, h: 1.3, fontSize: 30, bold: true, color: "FFFFFF", fontFace: "Calibri" });
  cover.addText(`${COMPANY_NAME} | ${scope}`, { x: 0.6, y: 3.8, w: 8.5, h: 0.35, fontSize: 13, color: "E3F3EC", fontFace: "Calibri" });
  // Logo GYS transparan, diberi kartu putih agar tulisan abu-abunya terbaca di latar hijau
  cover.addShape(pptx.ShapeType.roundRect, { x: 0.55, y: 4.35, w: 0.7, h: 0.7, fill: { color: "FFFFFF" }, rectRadius: 0.08, line: { color: "FFFFFF" } });
  cover.addImage({ data: gys.data, x: 0.6, y: 4.4, w: 0.6, h: 0.6 });
  cover.addText(`${tr("Disusun oleh", "Prepared by")} ${preparedBy}, ${new Date().toLocaleDateString(locale(lang), { day: "numeric", month: "long", year: "numeric" })}\nDeveloped by Nusa Safety`, { x: 1.3, y: 4.4, w: 7, h: 0.6, fontSize: 9, color: "BFE3D4", fontFace: "Calibri" });

  // Slide 2: ringkasan KPI
  const s2 = master(tr("Kondisi aktual program PEDULI", "Current status of the PEDULI program"));
  const dPct = s.deltaTotalPct != null ? `${s.deltaTotalPct > 0 ? "+" : ""}${s.deltaTotalPct}%` : null;
  const tiles = [
    [tr("Laporan masuk", "Reports received"), `${s.total}`, dPct ? tr(`${dPct} dari periode lalu`, `${dPct} vs previous period`) : tr("belum ada pembanding", "no comparison yet")],
    [tr("Partisipasi pelapor", "Reporter participation"), `${s.participation}%`, tr(`${s.reporters} dari ${s.activeUsers} pengguna`, `${s.reporters} of ${s.activeUsers} users`)],
    [tr("Waktu penutupan rerata", "Average closure time"), tr(`${s.closureDays} hari`, `${s.closureDays} days`), tr(`${s.prevClosureDays} hari periode lalu`, `${s.prevClosureDays} days previous period`)],
    [tr("Penutupan tepat waktu", "On-time closure"), `${s.onTime}%`, tr(`${s.closedInPeriod} laporan ditutup`, `${s.closedInPeriod} ${plural(s.closedInPeriod, "report", "reports")} closed`)],
    [tr("Risiko tinggi terbuka", "Open high-risk items"), `${s.highOpen}`, tr(`${s.overdueOpen} lewat target`, `${s.overdueOpen} past target date`)],
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
    { name: tr("Masuk", "Received"), labels: stats.trend.map((t) => t.label), values: stats.trend.map((t) => t.masuk) },
    { name: tr("Ditutup", "Closed"), labels: stats.trend.map((t) => t.label), values: stats.trend.map((t) => t.ditutup) },
  ], { x: 0.35, y: 3.0, w: 5.6, h: 2.15, chartColors: ["0A785B", "C9A227"], lineSize: 2, lineDataSymbol: "circle", lineDataSymbolSize: 5, showLegend: true, legendPos: "t", legendFontSize: 8, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, showTitle: true, title: tr("Tren laporan masuk dan ditutup", "Trend of reports received and closed"), titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });
  s2.addChart(pptx.ChartType.doughnut, [{ name: tr("Risiko", "Risk"), labels: stats.riskDist.map((r) => L.RISK_LABEL[r.key as Risk]), values: stats.riskDist.map((r) => r.count) }], { x: 6.1, y: 3.0, w: 3.55, h: 2.15, chartColors: ["2E9E6B", "D9A520", "E07A1F", "C8373B"], holeSize: 60, showPercent: true, showLegend: true, legendPos: "r", legendFontSize: 8, showTitle: true, title: tr("Sebaran tingkat risiko", "Risk level distribution"), titleFontSize: 10, titleColor: "14211C", dataLabelFontSize: 8 });

  // Slide 3: peta panas dan tindak lanjut
  const s3 = master(tr("Area rawan dan kinerja tindak lanjut", "High-risk areas and follow-up performance"));
  const heatRows = [
    [{ text: "Area", options: { bold: true, color: "FFFFFF", fill: { color: "006042" } } }, ...CATEGORIES.map((c) => ({ text: L.CATEGORY_SHORT[c], options: { bold: true, color: "FFFFFF", fill: { color: "006042" }, align: "center" as const } }))],
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
  s3.addText(tr("Warna makin hangat menandakan jumlah laporan makin banyak.", "Warmer colours indicate a higher number of reports."), { x: 0.35, y: 4.1, w: 5.3, h: 0.3, fontSize: 8, color: "67766E", italic: true, fontFace: "Calibri" });
  s3.addChart(pptx.ChartType.bar, [{ name: tr("Laporan", "Reports"), labels: stats.aging.map((a) => a.label), values: stats.aging.map((a) => a.count) }], { x: 5.85, y: 1.6, w: 3.8, h: 1.75, barDir: "bar", chartColors: ["0A785B"], showValue: true, dataLabelFontSize: 8, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, showTitle: true, title: tr("Umur tindak lanjut yang masih terbuka", "Age of open follow-ups"), titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });
  s3.addChart(pptx.ChartType.bar, [{ name: tr("% tepat waktu", "% on time"), labels: stats.onTimeByArea.map((a) => a.area), values: stats.onTimeByArea.map((a) => a.pct) }], { x: 5.85, y: 3.4, w: 3.8, h: 1.8, barDir: "bar", chartColors: ["C9A227"], showValue: true, dataLabelFontSize: 8, dataLabelFormatCode: '0"%"', valAxisMaxVal: 100, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, showTitle: true, title: tr("Penutupan tepat waktu per area", "On-time closure by area"), titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });

  // Slide 4: kategori, status, hierarki
  const s4 = master(tr("Jenis bahaya, status, dan hierarki pengendalian", "Hazard types, status, and hierarchy of controls"));
  s4.addChart(pptx.ChartType.bar, [{ name: tr("Laporan", "Reports"), labels: stats.categoryDist.map((c) => L.CATEGORY_SHORT[c.key as Category]), values: stats.categoryDist.map((c) => c.count) }], { x: 0.35, y: 1.65, w: 3.1, h: 3.4, chartColors: ["0A785B"], showValue: true, dataLabelFontSize: 8, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, showTitle: true, title: tr("Jenis bahaya", "Hazard type"), titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });
  s4.addChart(pptx.ChartType.bar, [{ name: tr("Laporan", "Reports"), labels: stats.statusDist.map((c) => L.STATUS_LABEL[c.key as Status]), values: stats.statusDist.map((c) => c.count) }], { x: 3.55, y: 1.65, w: 3.1, h: 3.4, barDir: "bar", chartColors: ["2B6CB0"], showValue: true, dataLabelFontSize: 8, catAxisLabelFontSize: 7, valAxisLabelFontSize: 8, showTitle: true, title: tr("Status laporan", "Report status"), titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });
  s4.addChart(pptx.ChartType.doughnut, [{ name: tr("Pengendalian", "Controls"), labels: stats.controlDist.map((c) => L.CONTROL_LABEL[c.key as Control]), values: stats.controlDist.map((c) => c.count) }], { x: 6.75, y: 1.65, w: 2.9, h: 3.4, chartColors: ["0A785B", "C9A227", "2B6CB0", "E07A1F", "7C3AED"], holeSize: 55, showPercent: true, showLegend: true, legendPos: "b", legendFontSize: 8, dataLabelFontSize: 8, showTitle: true, title: tr("Hierarki pengendalian", "Hierarchy of controls"), titleFontSize: 10, titleColor: "14211C" });

  // Slide 5: tabel indikator dan partisipasi
  const s5 = master(tr("Indikator kinerja dan partisipasi", "Performance indicators and participation"));
  const hdr = (t: string) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: "006042" } } });
  s5.addTable([[hdr(tr("Indikator", "Indicator")), hdr(tr("Nilai", "Value")), hdr(tr("Keterangan", "Notes"))], ...kpiRows(s, tr).map((r) => [{ text: r[0] }, { text: r[1], options: { bold: true, color: "006042" } }, { text: r[2], options: { color: "67766E" } }])], { x: 0.35, y: 1.65, w: 5.6, fontSize: 8.5, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [2.1, 1.0, 2.5], rowH: 0.26 });
  s5.addTable([[hdr(tr("Peran", "Role")), hdr(tr("Pengguna", "Users")), hdr(tr("Melapor", "Reported")), hdr("%")], ...stats.participationByRole.map((p) => [{ text: L.ROLE_LABEL[p.role as Role] }, { text: String(p.users) }, { text: String(p.reporters) }, { text: `${p.pct}%`, options: { bold: true } }])], { x: 6.15, y: 1.65, w: 3.5, fontSize: 8.5, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [1.4, 0.7, 0.7, 0.7], rowH: 0.26 });
  s5.addTable([[hdr(tr("Klasemen pelapor", "Reporter leaderboard")), hdr(tr("Laporan", "Reports")), hdr("Valid"), hdr(tr("Poin", "Points"))], ...stats.reporterRanking.slice(0, 6).map((r) => [{ text: `${r.rank}. ${r.name}` }, { text: String(r.laporan), options: { bold: true, color: "006042" } }, { text: String(r.valid) }, { text: String(r.poin) }])], { x: 6.15, y: 3.15, w: 3.5, fontSize: 8.5, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [1.7, 0.6, 0.6, 0.6], rowH: 0.26 });

  // Slide 6: risiko tinggi terbuka
  if (stats.highOpenList.length) {
    const s6 = master(tr("Risiko tinggi terbuka", "Open high-risk items"), tr("Diurutkan dari yang paling lama.", "Sorted from oldest."));
    s6.addTable([[hdr(tr("Nomor", "Number")), hdr("Area"), hdr(tr("Jenis bahaya", "Hazard type")), hdr(tr("Risiko", "Risk")), hdr("Status"), hdr(tr("Umur (hari)", "Age (days)"))], ...stats.highOpenList.map((r) => [{ text: r.number }, { text: r.area }, { text: L.CATEGORY_LABEL[r.category] }, { text: L.RISK_LABEL[r.riskLevel], options: { bold: true, color: r.riskLevel === "EKSTREM" ? "C8373B" : "E07A1F" } }, { text: L.STATUS_LABEL[r.status as Status] }, { text: String(r.days), options: { bold: true, color: r.days > 14 ? "C8373B" : "14211C" } }])], { x: 0.35, y: 1.65, w: 9.3, fontSize: 9, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [1.6, 1.3, 2.0, 1.0, 2.2, 1.2], rowH: 0.3 });
  }

  // Slide laporan ditolak: tetap ditampilkan agar keputusan penolakan dapat ditelaah
  const sR = master(tr("Sumber bahaya dan laporan ditolak", "Hazard sources and rejected reports"), tr(`${stats.summary.rejected} laporan ditolak dalam periode.`, `${stats.summary.rejected} ${plural(stats.summary.rejected, "report", "reports")} rejected in the period.`));
  sR.addChart(pptx.ChartType.bar, [{ name: tr("Laporan", "Reports"), labels: stats.hazardTypeDist.map((c) => L.HAZARD_TYPE_LABEL[c.key as HazardType]), values: stats.hazardTypeDist.map((c) => c.count) }], { x: 0.35, y: 1.65, w: 3.6, h: 3.4, barDir: "bar", chartColors: ["0A785B"], showValue: true, dataLabelFontSize: 8, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, showTitle: true, title: tr("Sumber bahaya", "Hazard source"), titleFontSize: 10, titleColor: "14211C", valGridLine: { color: "E3E9E5", size: 0.5 } });
  sR.addTable(
    [
      [hdr(tr("Nomor", "Number")), hdr("Area"), hdr(tr("Tahap", "Stage")), hdr(tr("Alasan", "Reason")), hdr(tr("Oleh", "By"))],
      ...(stats.rejectedList.length
        ? stats.rejectedList.slice(0, 10).map((r) => rejectRow(r, lang).slice(0, 5).map((t) => ({ text: String(t) })))
        : [[{ text: tr("Tidak ada laporan ditolak.", "No rejected reports.") }, { text: "" }, { text: "" }, { text: "" }, { text: "" }]]),
    ],
    { x: 4.15, y: 1.65, w: 5.5, fontSize: 8, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [1.3, 0.9, 0.9, 1.4, 1.0], rowH: 0.26 },
  );

  // Slide 7: kamus indikator
  const s7 = master(tr("Kamus indikator", "Indicator glossary"), tr("Indikator objektif untuk dasar kebijakan.", "Objective indicators as a basis for policy."));
  s7.addTable([[hdr(tr("Indikator", "Indicator")), hdr(tr("Rumus", "Formula")), hdr(tr("Dasar keputusan", "Decision basis"))], ...indicators(tr).map((i) => [{ text: i.k, options: { bold: true } }, { text: i.f }, { text: i.d, options: { color: "67766E" } }])], { x: 0.35, y: 1.65, w: 9.3, fontSize: 9, fontFace: "Calibri", border: { type: "solid", color: "E3E9E5", pt: 0.5 }, colW: [2.2, 4.0, 3.1], rowH: 0.4 });

  // Lampiran: tangkapan grafik dari dashboard (bila tersedia)
  if (images.trend) {
    const s8 = master(tr("Lampiran: grafik dashboard", "Appendix: dashboard charts"));
    s8.addImage({ data: images.trend, x: 0.35, y: 1.65, w: 5.6, h: 2.3 });
    if (images.risk) s8.addImage({ data: images.risk, x: 6.1, y: 1.65, w: 3.5, h: 2.3 });
    if (images.aging) s8.addImage({ data: images.aging, x: 0.35, y: 4.05, w: 4.6, h: 1.1 });
    if (images.onTime) s8.addImage({ data: images.onTime, x: 5.1, y: 4.05, w: 4.55, h: 1.1 });
  }

  await pptx.writeFile({ fileName: `${fileStamp(periodLabel, tr)}.pptx` });
}

// ---------------- CSV ----------------
export function exportCsv(ctx: ExportCtx) {
  const { stats, periodLabel, areaName, lang, tr } = ctx;
  const L = labels(lang);
  const rows: string[][] = [];
  rows.push([tr("Statistik PEDULI", "PEDULI statistics"), periodLabel, areaName ?? tr("Seluruh area", "All areas")]);
  rows.push([]);
  rows.push([tr("Indikator", "Indicator"), tr("Nilai", "Value"), tr("Keterangan", "Notes")]);
  kpiRows(stats.summary, tr).forEach((r) => rows.push(r));
  rows.push([]);
  rows.push([tr("Bulan", "Month"), tr("Masuk", "Received"), "Valid", tr("Ditutup", "Closed")]);
  stats.trend.forEach((t) => rows.push([t.label, String(t.masuk), String(t.valid), String(t.ditutup)]));
  rows.push([]);
  rows.push(["Area", ...CATEGORIES.map((c) => L.CATEGORY_LABEL[c]), "Total"]);
  stats.heatmap.forEach((h) => rows.push([h.area, ...h.cells.map(String), String(h.total)]));
  rows.push([]);
  rows.push([tr("Risiko", "Risk"), tr("Jumlah", "Count")]);
  stats.riskDist.forEach((r) => rows.push([L.RISK_LABEL[r.key as Risk], String(r.count)]));
  rows.push([]);
  rows.push(["Status", tr("Jumlah", "Count")]);
  stats.statusDist.forEach((r) => rows.push([L.STATUS_LABEL[r.key as Status], String(r.count)]));
  rows.push([]);
  rows.push([tr("Sumber bahaya", "Hazard source"), tr("Jumlah", "Count")]);
  stats.hazardTypeDist.forEach((r) => rows.push([L.HAZARD_TYPE_LABEL[r.key as HazardType], String(r.count)]));
  rows.push([]);
  rows.push([tr("Laporan ditolak", "Rejected reports"), "Area", tr("Tahap", "Stage"), tr("Alasan", "Reason"), tr("Oleh", "By"), tr("Tanggal", "Date")]);
  stats.rejectedList.forEach((r) => rows.push(rejectRow(r, lang)));
  rows.push([]);
  rows.push([tr("Umur tindak lanjut terbuka", "Age of open follow-ups"), tr("Jumlah", "Count")]);
  stats.aging.forEach((a) => rows.push([a.label, String(a.count)]));
  rows.push([]);
  rows.push(["Area", tr("Penutupan tepat waktu (%)", "On-time closure (%)"), tr("Jumlah ditutup", "Number closed")]);
  stats.onTimeByArea.forEach((a) => rows.push([a.area, String(a.pct), String(a.n)]));
  rows.push([]);
  rows.push([tr("Peringkat", "Rank"), tr("Pelapor", "Reporter"), tr("Jabatan", "Position"), tr("Departemen", "Department"), "Area", tr("Laporan", "Reports"), "Valid", tr("Tinggi+", "High+"), tr("Poin", "Points")]);
  stats.reporterRanking.forEach((r) => rows.push([String(r.rank), r.name, r.jabatan ?? L.ROLE_LABEL[r.role as Role], r.departemen ?? "", r.area ?? "", String(r.laporan), String(r.valid), String(r.tinggi), String(r.poin)]));
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${fileStamp(periodLabel, tr)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
