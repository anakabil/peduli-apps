import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Clock, User, Zap, AlertTriangle, ExternalLink, Award, Lightbulb, Printer } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { reportScope, canVerify, canDecide, canProgress, canClose } from "@/lib/workflow";
import { fmtDateTime, fmtDate, cn } from "@/lib/format";
import { Card, CardBody, CardHeader, KeyValue, Badge } from "@/components/ui";
import { StatusBadge, RiskBadge, CategoryBadge } from "@/components/report/badges";
import { VerifyPanel, DecidePanel, ProgressPanel, ClosePanel, ResubmitPanel, AuditButton } from "./panels";
import { Timeline } from "./timeline";
import { StopCardSummary } from "@/components/report/stop-card";
import { CONTROL_LABEL, ROLE_LABEL, type Control, type Role } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await db.report.findUnique({ where: { id }, select: { number: true } });
  return { title: r ? `Laporan ${r.number}` : "Laporan" };
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const report = await db.report.findFirst({
    where: { AND: [{ id }, reportScope(user)] },
    include: {
      reporter: { select: { id: true, name: true, role: true, jabatan: true, atasanId: true, areaId: true, image: true } },
      area: true,
      verifier: { select: { name: true } },
      decider: { select: { name: true } },
      pic: { select: { name: true } },
      closer: { select: { name: true } },
      photos: { select: { id: true, kind: true, createdAt: true } },
      events: { include: { actor: { select: { name: true, role: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!report) notFound();
  const settings = await getSettings();

  const showVerify = await canVerify(user, report);
  const showDecide = canDecide(user, report, settings.managerPeerReview);
  const showProgress = canProgress(user, report);
  const showClose = canClose(user, report);
  const showResubmit = report.status === "PERLU_REVISI" && report.reporterId === user.id;
  const candidates = showDecide
    ? await db.user.findMany({ where: { status: "ACTIVE", role: { in: ["MANAGER", "SUPERINTENDENT", "PENGAWAS"] } }, select: { id: true, name: true, role: true, jabatan: true }, orderBy: { name: "asc" } })
    : [];
  const defaultPic = settings.picByArea && report.area?.managerId ? report.area.managerId : null;

  const reportPhotos = report.photos.filter((p) => p.kind === "LAPORAN");
  const fixPhotos = report.photos.filter((p) => p.kind === "PERBAIKAN");
  const mapsUrl = report.lat != null && report.lng != null ? `https://www.google.com/maps?q=${report.lat},${report.lng}` : null;
  const now = new Date();
  const overdue =
    (report.status === "MENUNGGU_VERIFIKASI" && report.dueVerifyAt && report.dueVerifyAt < now) ||
    (report.status === "MENUNGGU_KEPUTUSAN" && report.dueDecideAt && report.dueDecideAt < now) ||
    ((report.status === "DALAM_PERBAIKAN" || report.status === "MENUNGGU_PENUTUPAN") && report.targetDate && report.targetDate < now);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between no-print">
        <Link href="/laporan" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700">
          <ArrowLeft size={16} /> Kembali
        </Link>
        <div className="flex items-center gap-2">
          {user.role === "ADMIN" && <AuditButton reportId={report.id} sampled={report.auditSampled} />}
          <Link href={`/laporan/${report.id}/cetak`} className="btn-secondary btn-sm">
            <Printer size={14} /> Cetak
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden anim-fade-up">
        <div className="border-b border-ink-100 bg-gradient-to-r from-brand-50 to-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-brand-700">{report.number}</span>
            <StatusBadge status={report.status} />
            <RiskBadge risk={report.riskLevel} />
            <CategoryBadge category={report.category} />
            <Badge tone="neutral">Jalur {report.path}</Badge>
            {report.escalated && (
              <span className="badge bg-orange/15 text-orange">
                <Zap size={11} /> Eskalasi Manager
              </span>
            )}
            {overdue && (
              <span className="badge bg-red/10 text-red">
                <AlertTriangle size={11} /> Lewat batas waktu
              </span>
            )}
            {report.syncedOffline && <Badge tone="info">Sinkron luring</Badge>}
            {report.auditSampled && <Badge tone="neutral">Diaudit</Badge>}
          </div>
          <h1 className="mt-2 text-lg font-bold text-ink-900 md:text-xl">{report.description}</h1>
          {report.suggestion && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-sm">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-gold" />
              <div>
                <span className="font-semibold">Tindakan pencegahan:</span> {report.suggestion}
                {report.suggestionApplied && <Badge tone="success" className="ml-2">Diterapkan</Badge>}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-5">
            {/* Foto */}
            <div>
              <div className="section-title mb-2">Foto laporan</div>
              <div className={cn("grid gap-2", reportPhotos.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
                {reportPhotos.map((p) => (
                  <a key={p.id} href={`/api/foto/${p.id}`} target="_blank" rel="noreferrer" className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/foto/${p.id}`} alt="Foto laporan" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </a>
                ))}
                {reportPhotos.length === 0 && <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">Tidak ada foto</div>}
              </div>
            </div>

            <StopCardSummary report={report} />

            {/* Terekam otomatis */}
            <div>
              <div className="section-title mb-2">Terekam otomatis</div>
              <KeyValue
                items={[
                  { k: "Pelapor", v: <span className="inline-flex items-center gap-1.5"><User size={14} className="text-ink-400" /> {report.reporter.name} <span className="text-ink-400">({ROLE_LABEL[report.reporter.role as Role]}{report.reporter.jabatan ? `, ${report.reporter.jabatan}` : ""})</span></span> },
                  { k: "Cap waktu server", v: <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-ink-400" /> {fmtDateTime(report.createdAt)}</span> },
                  { k: "Area kerja (dari koordinat)", v: <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-ink-400" /> {report.area?.name ?? "-"}{report.areaLabel ? ` - ${report.areaLabel}` : ""}</span> },
                  {
                    k: "Koordinat GPS",
                    v: mapsUrl ? (
                      <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                        {report.lat?.toFixed(5)}, {report.lng?.toFixed(5)} (akurasi {report.accuracyM != null ? Math.round(report.accuracyM) : "?"} m) <ExternalLink size={12} />
                      </a>
                    ) : (
                      "Tidak tersedia"
                    ),
                  },
                  ...(report.clientCreatedAt ? [{ k: "Waktu perangkat", v: fmtDateTime(report.clientCreatedAt) }] : []),
                ]}
              />
              {(report.outsideArea || report.locationFlag) && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber/10 px-3 py-2 text-xs text-ink-800">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#8a6a0a]" /> {report.locationFlag ?? "Lokasi di luar area kerja terdaftar, perlu ditinjau."}
                </div>
              )}
            </div>

            {/* Verifikasi */}
            {(report.verifiedAt || report.path === "A") && (
              <div>
                <div className="section-title mb-2">Verifikasi Superintendent</div>
                {report.verifiedAt ? (
                  <KeyValue
                    items={[
                      { k: "Hasil", v: <Badge tone={report.verificationResult === "VALID" ? "success" : report.verificationResult === "REVISI" ? "warn" : "danger"}>{report.verificationResult}</Badge> },
                      { k: "Oleh", v: report.verifier?.name },
                      { k: "Waktu", v: fmtDateTime(report.verifiedAt) },
                      { k: "Catatan", v: report.verificationNote },
                    ]}
                  />
                ) : (
                  <p className="text-sm text-ink-500">Menunggu verifikasi. Batas waktu {fmtDateTime(report.dueVerifyAt)}.</p>
                )}
              </div>
            )}

            {/* Keputusan */}
            <div>
              <div className="section-title mb-2">Keputusan Manager</div>
              {report.decidedAt ? (
                <KeyValue
                  items={[
                    { k: "Hasil", v: <Badge tone={report.decisionResult === "SETUJU" ? "success" : "danger"}>{report.decisionResult}</Badge> },
                    { k: "Oleh", v: report.decider?.name },
                    { k: "Waktu", v: fmtDateTime(report.decidedAt) },
                    { k: "Penanggung jawab", v: report.picName ?? report.pic?.name },
                    { k: "Sumber daya", v: [report.resourceTenaga, report.resourceBiaya, report.resourceMaterial].filter(Boolean).join(" | ") || "-" },
                    { k: "Target selesai", v: fmtDate(report.targetDate) },
                    { k: "Hierarki pengendalian", v: report.controlHierarchy ? CONTROL_LABEL[report.controlHierarchy as Control] : "-" },
                    { k: "Catatan", v: report.decisionNote },
                  ]}
                />
              ) : (
                <p className="text-sm text-ink-500">
                  {report.status === "MENUNGGU_KEPUTUSAN" ? `Menunggu keputusan. Batas waktu ${fmtDateTime(report.dueDecideAt)}.` : "Belum sampai tahap keputusan."}
                </p>
              )}
            </div>

            {/* Perbaikan dan penutupan */}
            {report.decisionResult === "SETUJU" && (
              <div>
                <div className="section-title mb-2">Perbaikan dan penutupan</div>
                <div className="flex items-center gap-3">
                  <div className="progress flex-1">
                    <span style={{ width: `${report.progressPct}%` }} />
                  </div>
                  <span className="text-sm font-bold text-brand-700">{report.progressPct}%</span>
                </div>
                {fixPhotos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {fixPhotos.map((p) => (
                      <a key={p.id} href={`/api/foto/${p.id}`} target="_blank" rel="noreferrer" className="aspect-[4/3] overflow-hidden rounded-xl border border-ink-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/foto/${p.id}`} alt="Bukti perbaikan" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-3">
                  <KeyValue
                    items={[
                      { k: "Perbaikan selesai", v: fmtDateTime(report.completedAt) },
                      { k: "Catatan penyelesaian", v: report.completionNote },
                      { k: "Ditutup oleh", v: report.closer?.name },
                      { k: "Waktu penutupan", v: fmtDateTime(report.closedAt) },
                      { k: "Tepat waktu", v: report.closedOnTime == null ? "-" : report.closedOnTime ? <Badge tone="success">Ya</Badge> : <Badge tone="danger">Terlambat</Badge> },
                      { k: "Catatan penutupan", v: report.closureNote },
                    ]}
                  />
                </div>
              </div>
            )}

            {report.pointsAwarded > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <Award size={18} className="text-gold" /> Poin diberikan kepada pelapor: <span className="font-bold">{report.pointsAwarded}</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="no-print space-y-4">
              {showVerify && <VerifyPanel reportId={report.id} />}
              {showDecide && <DecidePanel reportId={report.id} candidates={candidates.map((c) => ({ ...c, name: c.name ?? "-" }))} hasSuggestion={!!report.suggestion} defaultPicId={defaultPic} />}
              {showProgress && <ProgressPanel reportId={report.id} current={report.progressPct} />}
              {showClose && <ClosePanel reportId={report.id} hasSuggestion={!!report.suggestion && !report.suggestionApplied} />}
              {showResubmit && <ResubmitPanel report={report} />}
            </div>
            <Card>
              <CardHeader title="Jejak laporan" subtitle="Setiap perubahan tercatat dengan pelaku dan waktu." />
              <CardBody>
                <Timeline events={report.events} />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
