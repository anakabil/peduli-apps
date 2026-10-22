"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Chart } from "chart.js";
import { FileDown, Presentation, Printer, Table2, TrendingUp, Users, Clock, FileCheck2, AlertTriangle, Loader2 } from "lucide-react";
import type { Stats } from "@/lib/stats";
import { LineChart, BarChart, DoughnutChart, PALETTE, GREEN_RAMP, RISK_COLORS } from "@/components/charts/charts";
import { RiskBadge } from "@/components/report/badges";
import { Stat, Card, CardHeader, CardBody } from "@/components/ui";
import { CATEGORIES, CATEGORY_SHORT, CATEGORY_LABEL, RISK_LABEL, STATUS_LABEL, CONTROL_LABEL, ROLE_LABEL, type Category, type Risk, type Status, type Control, type Role } from "@/lib/constants";
import { cn, fmtNumber } from "@/lib/format";

type Json<T> = T extends Date ? string : T extends object ? { [K in keyof T]: Json<T[K]> } : T;
export type SerializedStats = Json<Stats>;

export const INDICATORS = [
  { k: "Partisipasi pelapor", f: "Pengguna yang melapor dibagi pengguna aktif, dikali 100%", d: "Arah sosialisasi dan penguatan budaya melapor" },
  { k: "Waktu respons verifikasi", f: "Rerata jam dari laporan dikirim hingga diverifikasi", d: "Beban kerja dan kecepatan Superintendent" },
  { k: "Waktu penutupan", f: "Rerata hari dari persetujuan hingga verifikasi penutupan", d: "Kecukupan sumber daya perbaikan" },
  { k: "Penutupan tepat waktu", f: "Tindak lanjut selesai sesuai target dibagi seluruh tindak lanjut", d: "Akuntabilitas penanggung jawab" },
  { k: "Risiko tinggi terbuka", f: "Jumlah tindak lanjut risiko Tinggi dan Ekstrem yang belum tuntas", d: "Prioritas eskalasi dan anggaran" },
  { k: "Laporan berulang", f: "Laporan dengan lokasi dan kategori sama dibagi seluruh laporan", d: "Efektivitas pengendalian, akar masalah belum tertangani" },
];

function heatColor(v: number, max: number) {
  if (v === 0) return { bg: "#f2faf6", fg: "#67766e" };
  const t = v / max;
  if (t < 0.25) return { bg: "#bfe3d4", fg: "#14211c" };
  if (t < 0.5) return { bg: "#f2d98a", fg: "#14211c" };
  if (t < 0.75) return { bg: "#f0a85a", fg: "#14211c" };
  return { bg: "#e0656a", fg: "#ffffff" };
}

export function StatsDashboard({ stats, periodLabel, areaName, canExport, preparedBy }: { stats: SerializedStats; periodLabel: string; areaName: string | null; canExport: boolean; preparedBy: string }) {
  const s = stats.summary;
  const refs = {
    trend: useRef<Chart<"line"> | undefined>(null),
    risk: useRef<Chart<"doughnut"> | undefined>(null),
    category: useRef<Chart<"bar"> | undefined>(null),
    aging: useRef<Chart<"bar"> | undefined>(null),
    onTime: useRef<Chart<"bar"> | undefined>(null),
    status: useRef<Chart<"bar"> | undefined>(null),
    control: useRef<Chart<"doughnut"> | undefined>(null),
    stop: useRef<Chart<"bar"> | undefined>(null),
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
      const ctx = { stats, periodLabel, areaName, preparedBy, images: images() };
      if (kind === "pdf") await mod.exportPdf(ctx);
      if (kind === "pptx") await mod.exportPptx(ctx);
      if (kind === "csv") mod.exportCsv(ctx);
    } finally {
      setBusy(null);
    }
  };

  const delta = (cur: number, prev: number, unit = "", invert = false) => {
    const d = Math.round((cur - prev) * 10) / 10;
    if (!prev && !cur) return { text: "tidak ada data pembanding", tone: "neutral" as const };
    const good = invert ? d <= 0 : d >= 0;
    return { text: `${d > 0 ? "+" : ""}${d}${unit} dari periode sebelumnya`, tone: good ? ("good" as const) : ("bad" as const) };
  };
  const dTotal = delta(s.total, s.prevTotal);
  const dPart = delta(s.participation, s.prevParticipation, "%");
  const dClose = delta(s.closureDays, s.prevClosureDays, " hari", true);
  const dOnTime = delta(s.onTime, s.prevOnTime, "%");
  const dHigh = delta(s.highOpen, s.highOpenPrev, "", true);

  return (
    <div className="space-y-5" id="statistik-root">
      {canExport && (
        <div className="no-print flex flex-wrap items-center gap-2 anim-fade-in">
          <span className="text-[13px] font-medium text-ink-600">Ekspor laporan</span>
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
            <Printer size={14} /> Cetak
          </button>
        </div>
      )}

      <div className="print-only mb-4">
        <div className="text-lg font-bold">Statistik PEDULI - {periodLabel}{areaName ? ` - ${areaName}` : ""}</div>
        <div className="text-xs text-ink-500">Disusun oleh {preparedBy}, PT. Garuda Yamato Steel. Developed by Nusa Safety.</div>
      </div>

      {/* KPI utama */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 stagger [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
        <Stat label="Laporan masuk" value={s.total} delta={dTotal.text} tone={dTotal.tone} icon={<TrendingUp size={16} />} hint={`${s.valid} valid, ${s.rejected} ditolak`} />
        <Stat label="Partisipasi pelapor" value={`${fmtNumber(s.participation, 1)}%`} delta={dPart.text} tone={dPart.tone} icon={<Users size={16} />} hint={`${s.reporters} dari ${s.activeUsers} pengguna aktif`} />
        <Stat label="Waktu penutupan rerata" value={`${fmtNumber(s.closureDays, 1)} hari`} delta={dClose.text} tone={dClose.tone} icon={<Clock size={16} />} hint={`${s.closedInPeriod} laporan ditutup`} />
        <Stat label="Penutupan tepat waktu" value={`${fmtNumber(s.onTime, 1)}%`} delta={dOnTime.text} tone={dOnTime.tone} icon={<FileCheck2 size={16} />} />
        <Stat label="Risiko tinggi terbuka" value={s.highOpen} delta={dHigh.text} tone={s.highOpen > 0 ? "bad" : "good"} icon={<AlertTriangle size={16} />} hint={`${s.overdueOpen} tindak lanjut lewat target`} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6 stagger">
        <Stat label="Respons verifikasi" value={`${fmtNumber(s.verifyHours, 1)} jam`} hint="rerata jalur A" />
        <Stat label="Waktu keputusan" value={`${fmtNumber(s.decideHours, 1)} jam`} hint="rerata hingga Manager" />
        <Stat label="Laporan berulang" value={`${fmtNumber(s.recurringPct, 1)}%`} hint={`${s.recurring} laporan, lokasi dan kategori sama`} tone={s.recurringPct > 30 ? "warn" : "neutral"} />
        <Stat label="Eskalasi otomatis" value={s.escalated} hint="risiko Tinggi/Ekstrem jalur A" />
        <Stat label="Di luar area kerja" value={s.outsideArea} hint="perlu tinjauan lokasi" tone={s.outsideArea > 0 ? "warn" : "neutral"} />
        <Stat label="Poin diberikan" value={s.pointsAwarded} hint={`${s.suggestionApplied} dari ${s.withSuggestion} usulan diterapkan`} />
      </div>

      {/* Tren dan sebaran risiko */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 [&>*]:min-w-0">
        <Card className="lg:col-span-3 anim-fade-up">
          <CardHeader title="Tren laporan masuk dan ditutup" subtitle="12 bulan hingga akhir periode" />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-64">
              <LineChart
                ref={refs.trend}
                data={{
                  labels: stats.trend.map((t) => t.label),
                  datasets: [
                    { label: "Masuk", data: stats.trend.map((t) => t.masuk), borderColor: PALETTE[0], backgroundColor: "rgba(10,120,91,0.12)", fill: true, tension: 0.3, cubicInterpolationMode: "monotone" as const },
                    { label: "Valid", data: stats.trend.map((t) => t.valid), borderColor: PALETTE[1], backgroundColor: "transparent", borderDash: [4, 4], tension: 0.3, cubicInterpolationMode: "monotone" as const },
                    { label: "Ditutup", data: stats.trend.map((t) => t.ditutup), borderColor: PALETTE[3], backgroundColor: "transparent", tension: 0.3, cubicInterpolationMode: "monotone" as const },
                  ],
                }}
              />
            </div>
          </CardBody>
        </Card>
        <Card className="lg:col-span-2 anim-fade-up">
          <CardHeader title="Sebaran tingkat risiko" subtitle={`${s.total} laporan dalam periode`} />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-64">
              <DoughnutChart
                ref={refs.risk}
                data={{
                  labels: stats.riskDist.map((r) => `${RISK_LABEL[r.key as Risk]} ${s.total ? Math.round((r.count / s.total) * 100) : 0}%`),
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
          <CardHeader title="Peta panas: area dan kategori bahaya" subtitle="Warna makin hangat menandakan jumlah laporan makin banyak." />
          <CardBody className="overflow-x-auto pt-3">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr>
                  <th className="pb-2 text-left text-xs font-medium text-ink-500">Area</th>
                  {CATEGORIES.map((c) => (
                    <th key={c} className="whitespace-nowrap px-1 pb-2 text-center text-xs font-medium text-ink-500">{CATEGORY_SHORT[c]}</th>
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
            <CardHeader title="Umur tindak lanjut yang masih terbuka" subtitle={`${s.openTotal} laporan terbuka seluruh waktu`} />
            <CardBody className="min-w-0 overflow-x-auto pt-3">
              <div className="h-40">
                <BarChart ref={refs.aging} horizontal data={{ labels: stats.aging.map((a) => a.label), datasets: [{ label: "Laporan", data: stats.aging.map((a) => a.count), backgroundColor: ["#35a885", "#d9a520", "#e07a1f", "#c8373b"], borderRadius: 6 }] }} options={{ plugins: { legend: { display: false } } }} />
              </div>
            </CardBody>
          </Card>
          <Card className="anim-fade-up">
            <CardHeader title="Penutupan tepat waktu per area" subtitle="12 bulan terakhir" />
            <CardBody className="min-w-0 overflow-x-auto pt-3">
              <div className="h-44">
                <BarChart ref={refs.onTime} horizontal data={{ labels: stats.onTimeByArea.map((a) => a.area), datasets: [{ label: "% tepat waktu", data: stats.onTimeByArea.map((a) => a.pct), backgroundColor: stats.onTimeByArea.map((a) => (a.pct >= 85 ? "#0a785b" : a.pct >= 70 ? "#d9a520" : "#c8373b")), borderRadius: 6 }] }} options={{ plugins: { legend: { display: false } }, scales: { x: { max: 100, beginAtZero: true, grid: { color: "#eef2ef" } }, y: { grid: { display: false } } } }} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Kategori, status, hierarki */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 [&>*]:min-w-0">
        <Card className="anim-fade-up">
          <CardHeader title="Kategori bahaya" />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-56">
              <BarChart ref={refs.category} data={{ labels: stats.categoryDist.map((c) => CATEGORY_SHORT[c.key as Category]), datasets: [{ label: "Laporan", data: stats.categoryDist.map((c) => c.count), backgroundColor: PALETTE[0], borderRadius: 6 }] }} options={{ plugins: { legend: { display: false } } }} />
            </div>
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardHeader title="Status laporan" />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-56">
              <BarChart ref={refs.status} horizontal data={{ labels: stats.statusDist.map((c) => STATUS_LABEL[c.key as Status]), datasets: [{ label: "Laporan", data: stats.statusDist.map((c) => c.count), backgroundColor: PALETTE[4], borderRadius: 6 }] }} options={{ plugins: { legend: { display: false } } }} />
            </div>
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardHeader title="Hierarki pengendalian" subtitle="Keputusan yang disetujui" />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-56">
              <DoughnutChart ref={refs.control} data={{ labels: stats.controlDist.map((c) => CONTROL_LABEL[c.key as Control]), datasets: [{ data: stats.controlDist.map((c) => c.count), backgroundColor: GREEN_RAMP, borderWidth: 2, borderColor: "#fff" }] }} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Kartu STOP (DuPont) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="anim-fade-up">
          <CardHeader title="Kartu STOP: kelompok daftar periksa" subtitle={`${s.stopCards} kartu STOP dalam periode`} />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <div className="h-56">
              <BarChart ref={refs.stop} horizontal data={{ labels: stats.stopGroupDist.map((g) => g.label), datasets: [{ label: "Laporan", data: stats.stopGroupDist.map((g) => g.count), backgroundColor: "#138d6b", borderRadius: 6 }] }} options={{ plugins: { legend: { display: false } } }} />
            </div>
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardHeader title="Tindakan tidak aman teratas" subtitle="Item daftar periksa yang paling sering dicentang" />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            {stats.stopTopItems.length === 0 ? <p className="text-sm text-ink-500">Belum ada item yang dicentang pada periode ini.</p> : (
              <table className="table">
                <thead><tr><th>Item</th><th className="text-right">Jumlah</th></tr></thead>
                <tbody>
                  {stats.stopTopItems.map((i) => (
                    <tr key={i.key}><td><div className="font-medium">{i.label}</div><div className="text-xs text-ink-500">{i.group}</div></td><td className="text-right font-bold">{i.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardHeader title="Aktivitas yang diobservasi" />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            {stats.activityDist.length === 0 ? <p className="text-sm text-ink-500">Belum ada data aktivitas pada periode ini.</p> : (
              <table className="table">
                <thead><tr><th>Aktivitas</th><th className="text-right">Laporan</th></tr></thead>
                <tbody>
                  {stats.activityDist.map((a) => (
                    <tr key={a.key}><td className="font-medium">{a.label}</td><td className="text-right font-bold">{a.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Tabel area, pelapor, partisipasi */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="anim-fade-up">
          <CardHeader title="Kinerja per area" />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <table className="table">
              <thead><tr><th>Area</th><th className="text-right">Laporan</th><th className="text-right">Tinggi+</th><th className="text-right">Terbuka</th></tr></thead>
              <tbody>
                {stats.byArea.map((a) => (
                  <tr key={a.area}><td className="font-medium">{a.area}</td><td className="text-right">{a.total}</td><td className={cn("text-right", a.tinggi > 0 && "font-bold text-orange")}>{a.tinggi}</td><td className="text-right">{a.terbuka}</td></tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardHeader title="Pelapor teratas" subtitle="Berdasarkan poin dalam periode" />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            {stats.topReporters.length === 0 ? <p className="text-sm text-ink-500">Belum ada laporan pada periode ini.</p> : (
              <table className="table">
                <thead><tr><th>Nama</th><th className="text-right">Laporan</th><th className="text-right">Valid</th><th className="text-right">Poin</th></tr></thead>
                <tbody>
                  {stats.topReporters.map((r, i) => (
                    <tr key={r.name + i}><td><div className="font-medium">{r.name}</div><div className="text-xs text-ink-500">{ROLE_LABEL[r.role as Role]}{r.departemen ? `, ${r.departemen}` : ""}</div></td><td className="text-right">{r.laporan}</td><td className="text-right">{r.valid}</td><td className="text-right font-bold text-brand-700">{r.poin}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardHeader title="Partisipasi per peran" />
          <CardBody className="min-w-0 overflow-x-auto pt-3">
            <table className="table">
              <thead><tr><th>Peran</th><th className="text-right">Pengguna</th><th className="text-right">Melapor</th><th className="text-right">%</th></tr></thead>
              <tbody>
                {stats.participationByRole.map((p) => (
                  <tr key={p.role}><td className="font-medium">{ROLE_LABEL[p.role as Role]}</td><td className="text-right">{p.users}</td><td className="text-right">{p.reporters}</td><td className="text-right font-bold">{p.pct}%</td></tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-xs text-ink-500">Jalur A (via Superintendent): {stats.pathDist[0].count}. Jalur B (langsung Manager): {stats.pathDist[1].count}.</div>
          </CardBody>
        </Card>
      </div>

      {/* Risiko tinggi terbuka */}
      <Card className="anim-fade-up">
        <CardHeader title="Risiko Tinggi dan Ekstrem yang masih terbuka" subtitle="Prioritas eskalasi dan anggaran, diurutkan dari yang paling lama." />
        <CardBody className="min-w-0 overflow-x-auto pt-3">
          {stats.highOpenList.length === 0 ? <p className="text-sm text-brand-700">Tidak ada. Seluruh risiko tinggi telah ditutup.</p> : (
            <table className="table">
              <thead><tr><th>Nomor</th><th>Area</th><th className="hidden sm:table-cell">Kategori</th><th>Risiko</th><th className="hidden sm:table-cell">Status</th><th className="text-right">Umur (hari)</th></tr></thead>
              <tbody>
                {stats.highOpenList.map((r) => (
                  <tr key={r.id}>
                    <td><Link href={`/laporan/${r.id}`} className="whitespace-nowrap text-xs font-semibold tabular-nums text-brand-700 hover:underline">{r.number}</Link><div className="text-xs text-ink-500 sm:hidden">{STATUS_LABEL[r.status as Status]}</div></td>
                    <td>{r.area}</td>
                    <td className="hidden sm:table-cell">{CATEGORY_LABEL[r.category]}</td>
                    <td><RiskBadge risk={r.riskLevel} /></td>
                    <td className="hidden sm:table-cell">{STATUS_LABEL[r.status as Status]}</td>
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
        <CardHeader title="Kamus indikator" subtitle="Indikator objektif sebagai dasar kebijakan." />
        <CardBody className="overflow-x-auto pt-3">
          <dl className="divide-y divide-ink-100 md:hidden">
            {INDICATORS.map((i) => (
              <div key={i.k} className="py-3 first:pt-0">
                <dt className="text-sm font-semibold text-ink-900">{i.k}</dt>
                <dd className="mt-1 text-sm text-ink-600">{i.f}</dd>
                <dd className="mt-1 text-xs text-ink-500">Dasar keputusan: {i.d}</dd>
              </div>
            ))}
          </dl>
          <table className="table hidden md:table">
            <thead><tr><th>Indikator</th><th>Rumus</th><th>Dasar keputusan</th></tr></thead>
            <tbody>
              {INDICATORS.map((i) => (
                <tr key={i.k}><td className="font-medium">{i.k}</td><td className="text-ink-600">{i.f}</td><td className="text-ink-600">{i.d}</td></tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      <p className="text-center text-xs text-ink-500">Data dihitung langsung dari basis data pada {new Date(stats.generatedAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB.</p>
    </div>
  );
}
