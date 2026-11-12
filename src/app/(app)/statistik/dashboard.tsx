"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Chart } from "chart.js";
import { FileDown, Presentation, Printer, Table2, TrendingUp, Users, Clock, FileCheck2, AlertTriangle, Loader2, Trophy } from "lucide-react";
import type { Stats } from "@/lib/stats";
import { LineChart, BarChart, DoughnutChart, PALETTE, GREEN_RAMP, RISK_COLORS } from "@/components/charts/charts";
import { RiskBadge } from "@/components/report/badges";
import { Stat, Card, CardHeader, CardBody } from "@/components/ui";
import { CATEGORIES, labels, type Category, type Risk, type Status, type Control, type Role, type HazardType } from "@/lib/constants";
import { cn, fmtNumber, fmtDate, fmtDateTime } from "@/lib/format";
import { makeTr, type Lang, type Tr } from "@/lib/i18n";
import { useLang, useTr } from "@/components/i18n/lang-provider";

type Json<T> = T extends Date ? string : T extends object ? { [K in keyof T]: Json<T[K]> } : T;
export type SerializedStats = Json<Stats>;

/** Tahap penolakan menurut bahasa */
export function rejectStageLabel(lang: Lang): Record<string, string> {
  const tr = makeTr(lang);
  return { VERIFIKASI: tr("Verifikasi", "Verification"), KEPUTUSAN: tr("Keputusan Manager", "Manager decision") };
}
/** Alasan penolakan untuk statistik (termasuk laporan lama tanpa alasan terstruktur) menurut bahasa */
export function rejectReasonStatLabel(lang: Lang): Record<string, string> {
  const tr = makeTr(lang);
  return {
    TIDAK_PERLU_TINDAKAN: tr("Tidak memerlukan tindakan", "No action required"),
    GANDA: tr("Laporan ganda", "Duplicate report"),
    TIDAK_BENAR: tr("Tidak sesuai fakta", "Does not match the facts"),
    LAINNYA: tr("Tanpa alasan terstruktur", "No structured reason"),
  };
}

/** Kamus indikator: nama (k), rumus (f), dan dasar keputusan (d) */
export function indicators(tr: Tr) {
  return [
    { k: tr("Partisipasi pelapor", "Reporter participation"), f: tr("Pengguna yang melapor dibagi pengguna aktif, dikali 100%", "Users who reported divided by active users, multiplied by 100%"), d: tr("Arah sosialisasi dan penguatan budaya melapor", "Direction of awareness campaigns and strengthening of the reporting culture") },
    { k: tr("Waktu respons verifikasi", "Verification response time"), f: tr("Rerata jam dari laporan dikirim hingga diverifikasi", "Average hours from report submission to verification"), d: tr("Beban kerja dan kecepatan Superintendent", "Superintendent workload and speed") },
    { k: tr("Waktu penutupan", "Closure time"), f: tr("Rerata hari dari persetujuan hingga verifikasi penutupan", "Average days from approval to closure verification"), d: tr("Kecukupan sumber daya perbaikan", "Adequacy of resources for corrective action") },
    { k: tr("Penutupan tepat waktu", "On-time closure"), f: tr("Tindak lanjut selesai sesuai target dibagi seluruh tindak lanjut", "Follow-ups completed by the target date divided by all follow-ups"), d: tr("Akuntabilitas penanggung jawab", "Accountability of persons in charge") },
    { k: tr("Risiko tinggi terbuka", "Open high-risk items"), f: tr("Jumlah tindak lanjut risiko Tinggi dan Ekstrem yang belum tuntas", "Number of High and Extreme risk follow-ups not yet completed"), d: tr("Prioritas eskalasi dan anggaran", "Escalation and budget priorities") },
    { k: tr("Laporan berulang", "Repeat reports"), f: tr("Laporan dengan lokasi dan jenis bahaya sama dibagi seluruh laporan", "Reports with the same location and hazard type divided by all reports"), d: tr("Efektivitas pengendalian, akar masalah belum tertangani", "Control effectiveness; root causes not yet addressed") },
  ];
}

function heatColor(v: number, max: number) {
  if (v === 0) return { bg: "#f2faf6", fg: "#67766e" };
  const t = v / max;
  if (t < 0.25) return { bg: "#bfe3d4", fg: "#14211c" };
  if (t < 0.5) return { bg: "#f2d98a", fg: "#14211c" };
  if (t < 0.75) return { bg: "#f0a85a", fg: "#14211c" };
  return { bg: "#e0656a", fg: "#ffffff" };
}

export function StatsDashboard({ stats, periodLabel, areaName, canExport, preparedBy }: { stats: SerializedStats; periodLabel: string; areaName: string | null; canExport: boolean; preparedBy: string }) {
  const tr = useTr();
  const lang = useLang();
  const L = labels(lang);
  const REJECT_STAGE_LABEL = rejectStageLabel(lang);
  const REJECT_REASON_STAT_LABEL = rejectReasonStatLabel(lang);
  const INDICATORS = indicators(tr);
  const s = stats.summary;
  const refs = {
    trend: useRef<Chart<"line"> | undefined>(null),
    risk: useRef<Chart<"doughnut"> | undefined>(null),
    category: useRef<Chart<"bar"> | undefined>(null),
    aging: useRef<Chart<"bar"> | undefined>(null),
    onTime: useRef<Chart<"bar"> | undefined>(null),
    status: useRef<Chart<"bar"> | undefined>(null),
    control: useRef<Chart<"doughnut"> | undefined>(null),
    hazard: useRef<Chart<"bar"> | undefined>(null),
  };
  const [busy, setBusy] = useState<string | null>(null);

  const images = () => {
    const out: Record<string, string | null> = {};
    for (const [k, r] of Object.entries(refs)) out[k] = r.current ? r.current.toBase64Image("image/png", 1) : null;
    return out;
  };
  const doExport = async (kind: "pdf" | "pptx" | "csv") => {
    setBusy(kind);
    try {
      const mod = await import("./export");
      const ctx = { stats, periodLabel, areaName, preparedBy, images: images(), lang, tr };
      if (kind === "pdf") await mod.exportPdf(ctx);
      if (kind === "pptx") await mod.exportPptx(ctx);
      if (kind === "csv") mod.exportCsv(ctx);
    } finally {
      setBusy(null);
    }
  };

  const delta = (cur: number, prev: number, unit = "", invert = false) => {
    const d = Math.round((cur - prev) * 10) / 10;
    if (!prev && !cur) return { text: tr("tidak ada data pembanding", "no comparison data"), tone: "neutral" as const };
    const good = invert ? d <= 0 : d >= 0;
    const v = `${d > 0 ? "+" : ""}${fmtNumber(d, 1, lang)}${unit}`;
    return { text: tr(`${v} dari periode sebelumnya`, `${v} vs previous period`), tone: good ? ("good" as const) : ("bad" as const) };
  };
  const dTotal = delta(s.total, s.prevTotal);
  const dPart = delta(s.participation, s.prevParticipation, "%");
  const dClose = delta(s.closureDays, s.prevClosureDays, tr(" hari", " days"), true);
  const dOnTime = delta(s.onTime, s.prevOnTime, "%");
  const dHigh = delta(s.highOpen, s.highOpenPrev, "", true);

  return (
    <div className="space-y-5" id="statistik-root">
      {canExport && (
        <div className="no-print flex flex-wrap items-center gap-2 anim-fade-in">
          <span className="text-[13px] font-medium text-ink-600">{tr("Ekspor laporan", "Export report")}</span>
          <button className="btn-primary btn-sm" onClick={() => doExport("pdf")} disabled={!!busy}>
            {busy === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} PDF
          </button>
          <button className="btn-secondary btn-sm" onClick={() => doExport("pptx")} disabled={!!busy}>
            {busy === "pptx" ? <Loader2 size={14} className="animate-spin" /> : <Presentation size={14} />} PowerPoint
          </button>
          <button className="btn-secondary btn-sm" onClick={() => doExport("csv")} disabled={!!busy}>
            {busy === "csv" ? <Loader2 size={14} className="animate-spin" /> : <Table2 size={14} />} CSV
          </button>
          <button className="btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={14} /> {tr("Cetak", "Print")}
          </button>
        </div>
      )}

      <div className="print-only mb-4">
        <div className="text-lg font-bold">{tr("Statistik PEDULI", "PEDULI statistics")} - {periodLabel}{areaName ? ` - ${areaName}` : ""}</div>
        <div className="text-xs text-ink-500">{tr(`Disusun oleh ${preparedBy}, PT. Garuda Yamato Steel. Developed by Nusa Safety.`, `Prepared by ${preparedBy}, PT. Garuda Yamato Steel. Developed by Nusa Safety.`)}</div>
      </div>

      {/* KPI utama */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 stagger [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
        <Stat label={tr("Laporan masuk", "Reports received")} value={s.total} delta={dTotal.text} tone={dTotal.tone} icon={<TrendingUp size={16} />} hint={tr(`${s.valid} valid, ${s.rejected} ditolak`, `${s.valid} valid, ${s.rejected} rejected`)} />
        <Stat label={tr("Partisipasi pelapor", "Reporter participation")} value={`${fmtNumber(s.participation, 1, lang)}%`} delta={dPart.text} tone={dPart.tone} icon={<Users size={16} />} hint={tr(`${s.reporters} dari ${s.activeUsers} pengguna aktif`, `${s.reporters} of ${s.activeUsers} active users`)} />
        <Stat label={tr("Waktu penutupan rerata", "Average closure time")} value={tr(`${fmtNumber(s.closureDays, 1, lang)} hari`, `${fmtNumber(s.closureDays, 1, lang)} days`)} delta={dClose.text} tone={dClose.tone} icon={<Clock size={16} />} hint={tr(`${s.closedInPeriod} laporan ditutup`, `${s.closedInPeriod} report${s.closedInPeriod === 1 ? "" : "s"} closed`)} />
        <Stat label={tr("Penutupan tepat waktu", "On-time closure")} value={`${fmtNumber(s.onTime, 1, lang)}%`} delta={dOnTime.text} tone={dOnTime.tone} icon={<FileCheck2 size={16} />} />
        <Stat label={tr("Risiko tinggi terbuka", "Open high-risk items")} value={s.highOpen} delta={dHigh.text} tone={s.highOpen > 0 ? "bad" : "good"} icon={<AlertTriangle size={16} />} hint={tr(`${s.overdueOpen} tindak lanjut lewat target`, `${s.overdueOpen} follow-up${s.overdueOpen === 1 ? "" : "s"} past target date`)} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6 stagger">
        <Stat label={tr("Respons verifikasi", "Verification response")} value={tr(`${fmtNumber(s.verifyHours, 1, lang)} jam`, `${fmtNumber(s.verifyHours, 1, lang)} hours`)} hint={tr("rerata jalur A", "path A average")} />
        <Stat label={tr("Waktu keputusan", "Decision time")} value={tr(`${fmtNumber(s.decideHours, 1, lang)} jam`, `${fmtNumber(s.decideHours, 1, lang)} hours`)} hint={tr("rerata hingga Manager", "average until Manager decision")} />
        <Stat label={tr("Laporan berulang", "Repeat reports")} value={`${fmtNumber(s.recurringPct, 1, lang)}%`} hint={tr(`${s.recurring} laporan, lokasi dan jenis bahaya sama`, `${s.recurring} report${s.recurring === 1 ? "" : "s"}, same location and hazard type`)} tone={s.recurringPct > 30 ? "warn" : "neutral"} />
        <Stat label={tr("Eskalasi otomatis", "Automatic escalation")} value={s.escalated} hint={tr("risiko Tinggi/Ekstrem jalur A", "High/Extreme risk, path A")} />
        <Stat label={tr("Di luar area kerja", "Outside work area")} value={s.outsideArea} hint={tr("perlu tinjauan lokasi", "location review needed")} tone={s.outsideArea > 0 ? "warn" : "neutral"} />
        <Stat label={tr("Poin diberikan", "Points awarded")} value={s.pointsAwarded} hint={tr(`${s.suggestionApplied} dari ${s.withSuggestion} usulan diterapkan`, `${s.suggestionApplied} of ${s.withSuggestion} suggested actions implemented`)} />
      </div>

      {/* Tren dan sebaran risiko */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 [&>*]:min-w-0">
        <Card className="lg:col-span-3 anim-fade-up">
          <CardHeader title={tr("Tren laporan", "Report trend")} subtitle={tr("12 bulan hingga akhir periode", "12 months to the end of the period")} />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-64">
              <LineChart
                ref={refs.trend}
                data={{
                  labels: stats.trend.map((t) => t.label),
                  datasets: [
                    { label: tr("Masuk", "Received"), data: stats.trend.map((t) => t.masuk), borderColor: PALETTE[0], backgroundColor: "rgba(10,120,91,0.12)", fill: true, tension: 0.3, cubicInterpolationMode: "monotone" as const },
                    { label: "Valid", data: stats.trend.map((t) => t.valid), borderColor: PALETTE[1], backgroundColor: "transparent", borderDash: [4, 4], tension: 0.3, cubicInterpolationMode: "monotone" as const },
                    { label: tr("Ditutup", "Closed"), data: stats.trend.map((t) => t.ditutup), borderColor: PALETTE[3], backgroundColor: "transparent", tension: 0.3, cubicInterpolationMode: "monotone" as const },
                  ],
                }}
              />
            </div>
          </CardBody>
        </Card>
        <Card className="lg:col-span-2 anim-fade-up">
          <CardHeader title={tr("Sebaran tingkat risiko", "Risk level distribution")} subtitle={tr(`${s.total} laporan dalam periode`, `${s.total} report${s.total === 1 ? "" : "s"} in the period`)} />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-64">
              <DoughnutChart
                ref={refs.risk}
                data={{
                  labels: stats.riskDist.map((r) => `${L.RISK_LABEL[r.key as Risk]} ${s.total ? Math.round((r.count / s.total) * 100) : 0}%`),
                  datasets: [{ data: stats.riskDist.map((r) => r.count), backgroundColor: stats.riskDist.map((r) => RISK_COLORS[r.key as keyof typeof RISK_COLORS]), borderWidth: 2, borderColor: "#fff" }],
                }}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Peta panas dan umur tindak lanjut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 [&>*]:min-w-0">
        <Card className="lg:col-span-3 anim-fade-up">
          <CardHeader title={tr("Peta panas area", "Area heat map")} subtitle={tr("Area dan jenis bahaya.", "Area and hazard type.")} />
          <CardBody className="overflow-x-auto pt-3">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr>
                  <th className="pb-2 text-left text-xs font-medium text-ink-500">Area</th>
                  {CATEGORIES.map((c) => (
                    <th key={c} className="whitespace-nowrap px-1 pb-2 text-center text-xs font-medium text-ink-500">{L.CATEGORY_SHORT[c]}</th>
                  ))}
                  <th className="whitespace-nowrap px-1 pb-2 text-center text-xs font-medium text-ink-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.heatmap.map((h) => (
                  <tr key={h.areaId}>
                    <td className="whitespace-nowrap py-1 pr-2 font-semibold">{h.area}</td>
                    {h.cells.map((v, i) => {
                      const c = heatColor(v, stats.heatMax);
                      return (
                        <td key={i} className="p-1 text-center">
                          <div className="rounded-lg py-2 font-bold transition-transform hover:scale-105" style={{ background: c.bg, color: c.fg }}>{v}</div>
                        </td>
                      );
                    })}
                    <td className="p-1 text-center font-bold text-ink-700">{h.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          <Card className="anim-fade-up">
            <CardHeader title={tr("Umur tindak lanjut", "Follow-up age")} subtitle={tr(`${s.openTotal} laporan terbuka seluruh waktu`, `${s.openTotal} open report${s.openTotal === 1 ? "" : "s"}, all time`)} />
            <CardBody className="min-w-0 overflow-x-auto pt-3">
              <div className="h-40">
                <BarChart ref={refs.aging} horizontal data={{ labels: stats.aging.map((a) => a.label), datasets: [{ label: tr("Laporan", "Reports"), data: stats.aging.map((a) => a.count), backgroundColor: ["#35a885", "#d9a520", "#e07a1f", "#c8373b"], borderRadius: 6 }] }} options={{ plugins: { legend: { display: false } } }} />
              </div>
            </CardBody>
          </Card>
          <Card className="anim-fade-up">
            <CardHeader title={tr("Tepat waktu per area", "On-time closure by area")} subtitle={tr("12 bulan terakhir", "Last 12 months")} />
            <CardBody className="min-w-0 overflow-x-auto pt-3">
              <div className="h-44">
                <BarChart ref={refs.onTime} horizontal data={{ labels: stats.onTimeByArea.map((a) => a.area), datasets: [{ label: tr("% tepat waktu", "% on time"), data: stats.onTimeByArea.map((a) => a.pct), backgroundColor: stats.onTimeByArea.map((a) => (a.pct >= 85 ? "#0a785b" : a.pct >= 70 ? "#d9a520" : "#c8373b")), borderRadius: 6 }] }} options={{ plugins: { legend: { display: false } }, scales: { x: { max: 100, beginAtZero: true, grid: { color: "#eef2ef" } }, y: { grid: { display: false } } } }} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Kategori, status, hierarki */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 [&>*]:min-w-0">
        <Card className="anim-fade-up">
          <CardHeader title={tr("Jenis bahaya", "Hazard type")} />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-56">
              <BarChart ref={refs.category} data={{ labels: stats.categoryDist.map((c) => L.CATEGORY_SHORT[c.key as Category]), datasets: [{ label: tr("Laporan", "Reports"), data: stats.categoryDist.map((c) => c.count), backgroundColor: PALETTE[0], borderRadius: 6 }] }} options={{ plugins: { legend: { display: false } } }} />
            </div>
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardHeader title={tr("Status laporan", "Report status")} />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-56">
              <BarChart ref={refs.status} horizontal data={{ labels: stats.statusDist.map((c) => L.STATUS_LABEL[c.key as Status]), datasets: [{ label: tr("Laporan", "Reports"), data: stats.statusDist.map((c) => c.count), backgroundColor: PALETTE[4], borderRadius: 6 }] }} options={{ plugins: { legend: { display: false } } }} />
            </div>
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardHeader title={tr("Hierarki pengendalian", "Hierarchy of controls")} subtitle={tr("Keputusan yang disetujui", "Approved decisions")} />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-56">
              <DoughnutChart ref={refs.control} data={{ labels: stats.controlDist.map((c) => L.CONTROL_LABEL[c.key as Control]), datasets: [{ data: stats.controlDist.map((c) => c.count), backgroundColor: GREEN_RAMP, borderWidth: 2, borderColor: "#fff" }] }} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Sumber bahaya dan laporan ditolak */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 [&>*]:min-w-0">
        <Card className="lg:col-span-2 anim-fade-up">
          <CardHeader title={tr("Sumber bahaya", "Hazard source")} />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-56">
              <BarChart ref={refs.hazard} horizontal data={{ labels: stats.hazardTypeDist.map((c) => L.HAZARD_TYPE_LABEL[c.key as HazardType]), datasets: [{ label: tr("Laporan", "Reports"), data: stats.hazardTypeDist.map((c) => c.count), backgroundColor: PALETTE[1], borderRadius: 6 }] }} options={{ plugins: { legend: { display: false } } }} />
            </div>
          </CardBody>
        </Card>
        <Card className="lg:col-span-3 anim-fade-up">
          <CardHeader
            title={tr("Laporan ditolak", "Rejected reports")}
            subtitle={tr(`${s.rejected} laporan dalam periode`, `${s.rejected} report${s.rejected === 1 ? "" : "s"} in the period`)}
            action={s.rejected > 0 ? <Link href="/laporan?tab=ditolak" className="no-print text-sm font-semibold text-brand-700 hover:underline">{tr("Lihat semua", "View all")}</Link> : undefined}
          />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              {stats.rejectedByStage.map((r) => (
                <span key={r.key} className="rounded-full bg-ink-50 px-2.5 py-1 font-medium text-ink-700 ring-1 ring-ink-100">{REJECT_STAGE_LABEL[r.key]}: <b className="tabular-nums">{r.count}</b></span>
              ))}
              {stats.rejectedByReason.filter((r) => r.count > 0).map((r) => (
                <span key={r.key} className="rounded-full bg-red/5 px-2.5 py-1 font-medium text-ink-800 ring-1 ring-red/20">{REJECT_REASON_STAT_LABEL[r.key]}: <b className="tabular-nums">{r.count}</b></span>
              ))}
            </div>
            {stats.rejectedList.length === 0 ? <p className="text-sm text-ink-500">{tr("Tidak ada laporan ditolak pada periode ini.", "No rejected reports in this period.")}</p> : (
              <table className="table">
                <thead><tr><th>{tr("Nomor", "Number")}</th><th>{tr("Area", "Area")}</th><th className="hidden sm:table-cell">{tr("Tahap", "Stage")}</th><th>{tr("Alasan", "Reason")}</th><th className="hidden md:table-cell">{tr("Oleh", "By")}</th></tr></thead>
                <tbody>
                  {stats.rejectedList.slice(0, 10).map((r) => (
                    <tr key={r.id}>
                      <td><Link href={`/laporan/${r.id}`} className="whitespace-nowrap text-xs font-semibold tabular-nums text-brand-700 hover:underline">{r.number}</Link><div className="text-xs text-ink-500">{fmtDate(r.at, lang)}</div></td>
                      <td>{r.area}</td>
                      <td className="hidden sm:table-cell">{REJECT_STAGE_LABEL[r.stage]}</td>
                      <td>{REJECT_REASON_STAT_LABEL[r.reason ?? "LAINNYA"] ?? REJECT_REASON_STAT_LABEL.LAINNYA}</td>
                      <td className="hidden md:table-cell">{r.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Klasemen pelapor */}
      <ReporterRanking ranking={stats.reporterRanking} activeUsers={s.activeUsers} />

      {/* Tabel area dan partisipasi */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card className="anim-fade-up">
          <CardHeader title={tr("Kinerja per area", "Performance by area")} />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <table className="table">
              <thead><tr><th>{tr("Area", "Area")}</th><th className="text-right">{tr("Laporan", "Reports")}</th><th className="text-right">{tr("Tinggi+", "High+")}</th><th className="text-right">{tr("Terbuka", "Open")}</th></tr></thead>
              <tbody>
                {stats.byArea.map((a) => (
                  <tr key={a.area}><td className="font-medium">{a.area}</td><td className="text-right">{a.total}</td><td className={cn("text-right", a.tinggi > 0 && "font-bold text-orange")}>{a.tinggi}</td><td className="text-right">{a.terbuka}</td></tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardHeader title={tr("Partisipasi per peran", "Participation by role")} />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <table className="table">
              <thead><tr><th>{tr("Peran", "Role")}</th><th className="text-right">{tr("Pengguna", "Users")}</th><th className="text-right">{tr("Melapor", "Reported")}</th><th className="text-right">%</th></tr></thead>
              <tbody>
                {stats.participationByRole.map((p) => (
                  <tr key={p.role}><td className="font-medium">{L.ROLE_LABEL[p.role as Role]}</td><td className="text-right">{p.users}</td><td className="text-right">{p.reporters}</td><td className="text-right font-bold">{p.pct}%</td></tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-xs text-ink-500">{tr(`Jalur A (via Superintendent): ${stats.pathDist[0].count}. Jalur B (langsung Manager): ${stats.pathDist[1].count}.`, `Path A (via Superintendent): ${stats.pathDist[0].count}. Path B (directly to Manager): ${stats.pathDist[1].count}.`)}</div>
          </CardBody>
        </Card>
      </div>

      {/* Risiko tinggi terbuka */}
      <Card className="anim-fade-up">
        <CardHeader title={tr("Risiko tinggi terbuka", "Open high-risk items")} subtitle={tr("Diurutkan dari yang paling lama.", "Sorted from oldest.")} />
        <CardBody className="min-w-0 overflow-x-auto pt-3">
          {stats.highOpenList.length === 0 ? <p className="text-sm text-brand-700">{tr("Tidak ada. Seluruh risiko tinggi telah ditutup.", "None. All high-risk items have been closed.")}</p> : (
            <table className="table">
              <thead><tr><th>{tr("Nomor", "Number")}</th><th>{tr("Area", "Area")}</th><th className="hidden sm:table-cell">{tr("Jenis bahaya", "Hazard type")}</th><th>{tr("Risiko", "Risk")}</th><th className="hidden sm:table-cell">{tr("Status", "Status")}</th><th className="text-right">{tr("Umur (hari)", "Age (days)")}</th></tr></thead>
              <tbody>
                {stats.highOpenList.map((r) => (
                  <tr key={r.id}>
                    <td><Link href={`/laporan/${r.id}`} className="whitespace-nowrap text-xs font-semibold tabular-nums text-brand-700 hover:underline">{r.number}</Link><div className="text-xs text-ink-500 sm:hidden">{L.STATUS_LABEL[r.status as Status]}</div></td>
                    <td>{r.area}</td>
                    <td className="hidden sm:table-cell">{L.CATEGORY_LABEL[r.category]}</td>
                    <td><RiskBadge risk={r.riskLevel} /></td>
                    <td className="hidden sm:table-cell">{L.STATUS_LABEL[r.status as Status]}</td>
                    <td className={cn("text-right font-bold tabular-nums", r.days > 14 && "text-red")}>{r.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Kamus indikator */}
      <Card className="anim-fade-up">
        <CardHeader title={tr("Kamus indikator", "Indicator glossary")} />
        <CardBody className="overflow-x-auto pt-3">
          <dl className="divide-y divide-ink-100 md:hidden">
            {INDICATORS.map((i) => (
              <div key={i.k} className="py-3 first:pt-0">
                <dt className="text-sm font-semibold text-ink-900">{i.k}</dt>
                <dd className="mt-1 text-sm text-ink-600">{i.f}</dd>
                <dd className="mt-1 text-xs text-ink-500">{tr("Dasar keputusan", "Decision basis")}: {i.d}</dd>
              </div>
            ))}
          </dl>
          <table className="table hidden md:table">
            <thead><tr><th>{tr("Indikator", "Indicator")}</th><th>{tr("Rumus", "Formula")}</th><th>{tr("Dasar keputusan", "Decision basis")}</th></tr></thead>
            <tbody>
              {INDICATORS.map((i) => (
                <tr key={i.k}><td className="font-medium">{i.k}</td><td className="text-ink-600">{i.f}</td><td className="text-ink-600">{i.d}</td></tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      <p className="text-center text-xs text-ink-500">{tr(`Data dihitung langsung dari basis data pada ${new Date(stats.generatedAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB.`, `Data calculated directly from the database on ${fmtDateTime(stats.generatedAt, true, "en")}.`)}</p>
    </div>
  );
}

const MEDAL: Record<number, string> = { 1: "/ikon/level/level-emas.webp", 2: "/ikon/level/level-perak.webp", 3: "/ikon/level/level-perunggu.webp" };

/** Klasemen seluruh pelapor dalam periode, urut jumlah laporan; sepuluh teratas tampil lebih dahulu */
function ReporterRanking({ ranking, activeUsers }: { ranking: SerializedStats["reporterRanking"]; activeUsers: number }) {
  const tr = useTr();
  const L = labels(useLang());
  const [all, setAll] = useState(false);
  const rows = all ? ranking : ranking.slice(0, 10);
  return (
    <Card className="anim-fade-up">
      <CardHeader
        title={tr("Klasemen pelapor", "Reporter leaderboard")}
        subtitle={
          ranking.length
            ? tr(`${ranking.length} dari ${activeUsers} pengguna aktif melapor dalam periode ini. Diurutkan dari jumlah laporan.`, `${ranking.length} of ${activeUsers} active users reported in this period. Sorted by number of reports.`)
            : tr("Belum ada laporan pada periode ini.", "No reports in this period yet.")
        }
        action={<Trophy size={18} className="shrink-0 text-gold" />}
      />
      {ranking.length > 0 && (
        <CardBody className="min-w-0 overflow-x-auto pt-3">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>{tr("Nama", "Name")}</th>
                <th className="hidden md:table-cell">{tr("Area", "Area")}</th>
                <th className="text-right">{tr("Laporan", "Reports")}</th>
                <th className="text-right">{tr("Valid", "Valid")}</th>
                <th className="hidden text-right sm:table-cell">{tr("Tinggi+", "High+")}</th>
                <th className="hidden text-right sm:table-cell">{tr("Poin", "Points")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-center">
                    {MEDAL[r.rank] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={MEDAL[r.rank]} alt={tr(`Peringkat ${r.rank}`, `Rank ${r.rank}`)} width={28} height={28} className="mx-auto size-7" />
                    ) : (
                      <span className="text-sm font-semibold tabular-nums text-ink-500">{r.rank}</span>
                    )}
                  </td>
                  <td>
                    <div className="font-medium text-ink-900">{r.name}</div>
                    <div className="text-xs text-ink-500">
                      {r.jabatan || L.ROLE_LABEL[r.role as Role]}
                      {r.departemen ? `, ${r.departemen}` : ""}
                      {r.area && r.area !== r.departemen && <span className="md:hidden">, {r.area}</span>}
                    </div>
                  </td>
                  <td className="hidden md:table-cell">{r.area ?? "-"}</td>
                  <td className="text-right text-base font-bold tabular-nums text-brand-700">{r.laporan}</td>
                  <td className="text-right tabular-nums">{r.valid}</td>
                  <td className={cn("hidden text-right tabular-nums sm:table-cell", r.tinggi > 0 && "font-semibold text-orange")}>{r.tinggi}</td>
                  <td className="hidden text-right tabular-nums sm:table-cell">{r.poin}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ranking.length > 10 && (
            <div className="no-print mt-3 text-center">
              <button type="button" onClick={() => setAll((v) => !v)} className="btn-secondary btn-sm min-h-11 md:min-h-0">
                {all ? tr("Tampilkan 10 teratas", "Show top 10") : tr(`Tampilkan semua (${ranking.length})`, `Show all (${ranking.length})`)}
              </button>
            </div>
          )}
        </CardBody>
      )}
    </Card>
  );
}
