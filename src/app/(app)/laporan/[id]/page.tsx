import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowDown, MapPin, Clock, User, Zap, AlertTriangle, ExternalLink, Award, Printer } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { reportScope, canVerify, canDecide, canProgress, canClose } from "@/lib/workflow";
import { fmtDateTime, fmtDate, cn } from "@/lib/format";
import { Card, CardBody, CardHeader, KeyValue, Badge } from "@/components/ui";
import { StatusBadge, RiskBadge, CategoryBadge } from "@/components/report/badges";
import { VerifyPanel, DecidePanel, ProgressPanel, ClosePanel, ResubmitPanel, AuditButton } from "./panels";
import { Timeline } from "./timeline";
import { labels, type Control, type Role, type HazardType, type RejectReason } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tr } = await getTr();
  const r = await db.report.findUnique({ where: { id }, select: { number: true } });
  return { title: r ? tr(`Laporan ${r.number}`, `Report ${r.number}`) : tr("Laporan", "Report") };
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { lang, tr } = await getTr();
  const L = labels(lang);
  const { id } = await params;
  const report = await db.report.findFirst({
    where: { AND: [{ id }, reportScope(user)] },
    include: {
      reporter: { select: { id: true, name: true, role: true, jabatan: true, atasanId: true, areaId: true, image: true } },
      area: true,
      verifier: { select: { name: true } },
      decider: { select: { name: true } },
      pic: { select: { name: true } },
      proposedPic: { select: { id: true, name: true, jabatan: true } },
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
  // Usulan pelapor didahulukan; bila tidak ada, Manager area (bila diaktifkan di pengaturan)
  const defaultPic = report.proposedPicId ?? (settings.picByArea && report.area?.managerId ? report.area.managerId : null);

  const reportPhotos = report.photos.filter((p) => p.kind === "LAPORAN");
  const fixPhotos = report.photos.filter((p) => p.kind === "PERBAIKAN");
  const mapsUrl = report.lat != null && report.lng != null ? `https://www.google.com/maps?q=${report.lat},${report.lng}` : null;
  const now = new Date();
  const overdue =
    (report.status === "MENUNGGU_VERIFIKASI" && report.dueVerifyAt && report.dueVerifyAt < now) ||
    (report.status === "MENUNGGU_KEPUTUSAN" && report.dueDecideAt && report.dueDecideAt < now) ||
    ((report.status === "DALAM_PERBAIKAN" || report.status === "MENUNGGU_PENUTUPAN") && report.targetDate && report.targetDate < now);

  const actionLabel = showVerify
    ? tr("Verifikasi laporan ini", "Verify this report")
    : showDecide
      ? tr("Putuskan laporan ini", "Decide on this report")
      : showProgress
        ? tr("Perbarui progres perbaikan", "Update corrective action progress")
        : showClose
          ? tr("Periksa dan tutup laporan", "Review and close report")
          : showResubmit
            ? tr("Kirim ulang revisi", "Resubmit revision")
            : null;

  return (
    <div className="mx-auto max-w-5xl">
      {actionLabel && (
        <a href="#aksi" className="no-print fixed inset-x-4 z-30 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(0,61,42,0.6)] lg:hidden" style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}>
          {actionLabel} <ArrowDown size={16} />
        </a>
      )}
      <div className="mb-4 flex items-center justify-between no-print">
        <Link href="/laporan" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-600 hover:text-brand-700">
          <ArrowLeft size={16} /> {tr("Kembali", "Back")}
        </Link>
        <div className="flex items-center gap-2">
          {user.role === "ADMIN" && <AuditButton reportId={report.id} sampled={report.auditSampled} />}
          <Link href={`/laporan/${report.id}/cetak`} className="btn-secondary btn-sm">
            <Printer size={14} /> {tr("Cetak", "Print")}
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden anim-fade-up">
        <div className="border-b border-ink-100 bg-gradient-to-r from-brand-50 to-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold tabular-nums text-brand-800">{report.number}</span>
            <StatusBadge status={report.status} />
            <RiskBadge risk={report.riskLevel} />
            <CategoryBadge category={report.category} />
            <Badge tone="neutral">{tr("Jalur", "Path")} {report.path}</Badge>
            {report.escalated && (
              <span className="badge bg-orange/15 text-orange">
                <Zap size={11} /> {tr("Eskalasi Manager", "Escalated to Manager")}
              </span>
            )}
            {overdue && (
              <span className="badge bg-red/10 text-red">
                <AlertTriangle size={11} /> {tr("Lewat batas waktu", "Past deadline")}
              </span>
            )}
            {report.syncedOffline && <Badge tone="info">{tr("Sinkron luring", "Synced from offline")}</Badge>}
            {report.auditSampled && <Badge tone="neutral">{tr("Diaudit", "Audited")}</Badge>}
          </div>
          <h1 className="mt-2 text-lg font-bold text-ink-900 md:text-xl">{report.description}</h1>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-5">
            {/* Foto */}
            <div>
              <div className="section-title mb-2">{tr("Foto laporan", "Report photos")}</div>
              <div className={cn("grid gap-2", reportPhotos.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
                {reportPhotos.map((p) => (
                  <a key={p.id} href={`/api/foto/${p.id}`} target="_blank" rel="noreferrer" className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/foto/${p.id}`} alt={tr("Foto laporan", "Report photo")} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </a>
                ))}
                {reportPhotos.length === 0 && <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">{tr("Tidak ada foto", "No photos")}</div>}
              </div>
            </div>

            {/* Rincian bahaya dan usulan perbaikan dari pelapor */}
            <div>
              <div className="section-title mb-2">{tr("Rincian bahaya", "Hazard details")}</div>
              <KeyValue
                hideEmpty
                items={[
                  { k: tr("Sumber bahaya", "Hazard source"), v: report.hazardType ? L.HAZARD_TYPE_LABEL[report.hazardType as HazardType] : null },
                  { k: tr("Dampak yang dapat ditimbulkan", "Potential impact"), v: report.impact },
                ]}
              />
            </div>
            {(report.immediateAction || report.suggestion || report.proposedPic) && (
              <div>
                <div className="section-title mb-2">{tr("Usulan perbaikan", "Suggested action")}</div>
                <KeyValue
                  hideEmpty
                  items={[
                    { k: tr("Tindakan perbaikan cepat", "Immediate action"), v: report.immediateAction },
                    { k: tr("Tindakan pencegahan", "Preventive action"), v: report.suggestion ? <>{report.suggestion}{report.suggestionApplied && <Badge tone="success" className="ml-2">{tr("Diterapkan", "Implemented")}</Badge>}</> : null },
                    { k: tr("Penanggung jawab", "Person in charge (PIC)"), v: report.proposedPic ? `${report.proposedPic.name ?? "-"}${report.proposedPic.jabatan ? `, ${report.proposedPic.jabatan}` : ""}` : null },
                  ]}
                />
              </div>
            )}

            {/* Terekam otomatis */}
            <div>
              <div className="section-title mb-2">{tr("Terekam otomatis", "Automatically recorded")}</div>
              <KeyValue
                items={[
                  { k: tr("Pelapor", "Reporter"), v: <span className="flex items-start gap-1.5"><User size={14} className="mt-0.5 shrink-0 text-ink-400" /><span><span className="block font-medium">{report.reporter.name}</span><span className="block text-xs text-ink-500">{L.ROLE_LABEL[report.reporter.role as Role]}{report.reporter.jabatan ? `, ${report.reporter.jabatan}` : ""}</span></span></span> },
                  { k: tr("Cap waktu server", "Server timestamp"), v: <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-ink-400" /> {fmtDateTime(report.createdAt, false, lang)}</span> },
                  { k: tr("Lokasi", "Location"), v: <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-ink-400" /> {report.area?.name ?? "-"}{report.areaLabel && !report.areaLabel.startsWith(report.area?.name ?? "\u0000") ? ` · ${report.areaLabel}` : ""}</span> },
                  {
                    k: tr("Koordinat GPS", "GPS coordinates"),
                    v: mapsUrl ? (
                      <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                        {report.lat?.toFixed(5)}, {report.lng?.toFixed(5)} ({tr("akurasi", "accuracy")} {report.accuracyM != null ? Math.round(report.accuracyM) : "?"} m) <ExternalLink size={12} />
                      </a>
                    ) : (
                      tr("Tidak tersedia", "Not available")
                    ),
                  },
                  ...(report.clientCreatedAt ? [{ k: tr("Waktu perangkat", "Device time"), v: fmtDateTime(report.clientCreatedAt, false, lang) }] : []),
                ]}
              />
              {(report.outsideArea || report.locationFlag) && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber/10 px-3 py-2 text-xs text-ink-800">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#8a6a0a]" /> {report.locationFlag ?? tr("Lokasi di luar area kerja terdaftar, perlu ditinjau.", "Location is outside the registered work area and needs review.")}
                </div>
              )}
            </div>

            {/* Verifikasi */}
            {(report.verifiedAt || report.path === "A") && (
              <div>
                <div className="section-title mb-2">{tr("Verifikasi Superintendent", "Superintendent verification")}</div>
                {report.verifiedAt ? (
                  <KeyValue
                    items={[
                      { k: tr("Hasil", "Result"), v: <Badge tone={report.verificationResult === "VALID" ? "success" : report.verificationResult === "REVISI" ? "warn" : "danger"}>{report.verificationResult === "VALID" ? tr("Valid", "Valid") : report.verificationResult === "REVISI" ? tr("Perlu revisi", "Revision required") : tr("Ditolak", "Rejected")}</Badge> },
                      ...(report.verificationResult === "TOLAK" && report.rejectReason ? [{ k: tr("Alasan", "Reason"), v: L.REJECT_REASON_LABEL[report.rejectReason as RejectReason] ?? report.rejectReason }] : []),
                      { k: tr("Oleh", "By"), v: report.verifier?.name },
                      { k: tr("Waktu", "Time"), v: fmtDateTime(report.verifiedAt, false, lang) },
                      { k: tr("Catatan", "Note"), v: report.verificationNote },
                    ]}
                  />
                ) : (
                  <p className="text-sm text-ink-500">{tr(`Menunggu verifikasi. Batas waktu ${fmtDateTime(report.dueVerifyAt)}.`, `Awaiting verification. Deadline ${fmtDateTime(report.dueVerifyAt, false, "en")}.`)}</p>
                )}
              </div>
            )}

            {/* Keputusan */}
            <div>
              <div className="section-title mb-2">{tr("Keputusan Manager", "Manager decision")}</div>
              {report.decidedAt ? (
                <KeyValue
                  hideEmpty
                  items={[
                    { k: tr("Hasil", "Result"), v: <Badge tone={report.decisionResult === "SETUJU" ? "success" : "danger"}>{report.decisionResult === "SETUJU" ? tr("Disetujui", "Approved") : tr("Ditolak", "Rejected")}</Badge> },
                    { k: tr("Alasan", "Reason"), v: report.decisionResult === "TOLAK" && report.rejectReason ? L.REJECT_REASON_LABEL[report.rejectReason as RejectReason] ?? report.rejectReason : null },
                    { k: tr("Oleh", "By"), v: report.decider?.name },
                    { k: tr("Waktu", "Time"), v: fmtDateTime(report.decidedAt, false, lang) },
                    { k: tr("Penanggung jawab", "Person in charge (PIC)"), v: report.picName ?? report.pic?.name },
                    { k: tr("Tenaga", "Manpower"), v: report.resourceTenaga },
                    { k: tr("Biaya", "Cost"), v: report.resourceBiaya },
                    { k: tr("Material", "Material"), v: report.resourceMaterial },
                    { k: tr("Target selesai", "Target date"), v: fmtDate(report.targetDate, lang) },
                    { k: tr("Hierarki pengendalian", "Hierarchy of controls"), v: report.controlHierarchy ? L.CONTROL_LABEL[report.controlHierarchy as Control] : null },
                    { k: tr("Catatan", "Note"), v: report.decisionNote },
                  ]}
                />
              ) : (
                <p className="text-sm text-ink-500">
                  {report.status === "MENUNGGU_KEPUTUSAN"
                    ? tr(`Menunggu keputusan. Batas waktu ${fmtDateTime(report.dueDecideAt)}.`, `Awaiting decision. Deadline ${fmtDateTime(report.dueDecideAt, false, "en")}.`)
                    : tr("Belum sampai tahap keputusan.", "Not yet at the decision stage.")}
                </p>
              )}
            </div>

            {/* Perbaikan dan penutupan */}
            {report.decisionResult === "SETUJU" && (
              <div>
                <div className="section-title mb-2">{tr("Perbaikan dan penutupan", "Corrective action and closure")}</div>
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
                        <img src={`/api/foto/${p.id}`} alt={tr("Bukti perbaikan", "Corrective action evidence")} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-3">
                  {!report.completedAt && !report.closedAt && <p className="text-sm text-ink-500">{tr("Perbaikan sedang berjalan. Rincian penyelesaian muncul setelah penanggung jawab melaporkan selesai.", "Corrective action is in progress. Completion details appear once the person in charge reports it complete.")}</p>}
                  <KeyValue
                    hideEmpty
                    items={[
                      { k: tr("Perbaikan selesai", "Corrective action completed"), v: fmtDateTime(report.completedAt, false, lang) },
                      { k: tr("Catatan penyelesaian", "Completion note"), v: report.completionNote },
                      { k: tr("Ditutup oleh", "Closed by"), v: report.closer?.name },
                      { k: tr("Waktu penutupan", "Closure time"), v: fmtDateTime(report.closedAt, false, lang) },
                      { k: tr("Tepat waktu", "On time"), v: report.closedOnTime == null ? null : report.closedOnTime ? <Badge tone="success">{tr("Ya", "Yes")}</Badge> : <Badge tone="danger">{tr("Terlambat", "Late")}</Badge> },
                      { k: tr("Catatan penutupan", "Closure note"), v: report.closureNote },
                    ]}
                  />
                </div>
              </div>
            )}

            {report.pointsAwarded > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <Award size={18} className="text-gold" /> {tr("Poin diberikan kepada pelapor:", "Points awarded to the reporter:")} <span className="font-bold">{report.pointsAwarded}</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div id="aksi" className="no-print scroll-mt-20 space-y-4">
              {showVerify && <VerifyPanel reportId={report.id} />}
              {showDecide && <DecidePanel reportId={report.id} candidates={candidates.map((c) => ({ ...c, name: c.name ?? "-" }))} hasSuggestion={!!report.suggestion} defaultPicId={defaultPic} />}
              {showProgress && <ProgressPanel reportId={report.id} current={report.progressPct} />}
              {showClose && <ClosePanel reportId={report.id} hasSuggestion={!!report.suggestion && !report.suggestionApplied} />}
              {showResubmit && <ResubmitPanel report={report} />}
            </div>
            <Card>
              <CardHeader title={tr("Jejak laporan", "Report history")} subtitle={tr("Setiap perubahan tercatat dengan pelaku dan waktu.", "Every change is recorded with the actor and time.")} />
              <CardBody>
                <Timeline events={report.events} lang={lang} />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
