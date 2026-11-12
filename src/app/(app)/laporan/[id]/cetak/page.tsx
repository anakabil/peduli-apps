import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { reportScope } from "@/lib/workflow";
import { fmtDateTime, fmtDate } from "@/lib/format";
import { labels, COMPANY_NAME, type Category, type Status, type Control, type Role, type HazardType, type RejectReason } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";
import { PrintButton } from "@/components/print-button";
import { RiskBadge } from "@/components/report/badges";
import { GysLogo, PeduliLogo } from "@/components/brand";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Cetak laporan", "Print report") };
}

export default async function PrintReport({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { lang, tr } = await getTr();
  const L = labels(lang);
  const dt = (d: Date | null | undefined) => fmtDateTime(d, false, lang);
  const { id } = await params;
  const r = await db.report.findFirst({
    where: { AND: [{ id }, reportScope(user)] },
    include: { reporter: true, area: true, proposedPic: { select: { name: true, jabatan: true } }, verifier: true, decider: true, pic: true, closer: true, photos: { select: { id: true, kind: true } }, events: { include: { actor: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!r) notFound();
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <tr>
      <td className="w-[38%] border border-ink-200 bg-ink-50 px-3 py-1.5 align-top text-xs font-semibold text-ink-600 sm:w-48">{k}</td>
      <td className="border border-ink-200 px-3 py-1.5 text-sm">{v ?? "-"}</td>
    </tr>
  );
  return (
    <div className="print-sheet mx-auto max-w-3xl bg-white p-5 md:p-8 card">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton />
      </div>
      <div className="flex items-center justify-between border-b-2 border-brand-700 pb-3">
        <div className="flex items-center gap-3">
          <GysLogo size={44} />
          <div>
            <div className="text-sm font-bold">{COMPANY_NAME}</div>
            <div className="text-xs text-ink-500">{tr("Formulir Laporan Bahaya dan Upaya Pengendalian", "Hazard Reporting and Control Measures Form")}</div>
          </div>
        </div>
        <PeduliLogo height={30} />
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <h1 className="text-lg font-bold">{tr("Laporan", "Report")} {r.number}</h1>
        <span className="text-sm">{tr("Status", "Status")}: <b>{L.STATUS_LABEL[r.status as Status]}</b></span>
      </div>
      <table className="mt-3 w-full border-collapse">
        <tbody>
          <Row k={tr("Pelapor", "Reporter")} v={`${r.reporter.name} (${L.ROLE_LABEL[r.reporter.role as Role]}${r.reporter.jabatan ? `, ${r.reporter.jabatan}` : ""})`} />
          <Row k={tr("Cap waktu server", "Server timestamp")} v={dt(r.createdAt)} />
          <Row k={tr("Lokasi", "Location")} v={`${r.area?.name ?? "-"}${r.areaLabel ? ` - ${r.areaLabel}` : ""}`} />
          <Row k={tr("Koordinat", "Coordinates")} v={r.lat != null ? `${r.lat.toFixed(5)}, ${r.lng?.toFixed(5)} (${tr("akurasi", "accuracy")} ${Math.round(r.accuracyM ?? 0)} m)` : "-"} />
          <Row k={tr("Jenis bahaya", "Hazard type")} v={L.CATEGORY_LABEL[r.category as Category]} />
          <Row k={tr("Risiko awal", "Initial risk")} v={<RiskBadge risk={r.riskLevel} />} />
          <Row k={tr("Sumber bahaya", "Hazard source")} v={r.hazardType ? L.HAZARD_TYPE_LABEL[r.hazardType as HazardType] : null} />
          <Row k={tr("Uraian bahaya", "Hazard description")} v={r.description} />
          <Row k={tr("Dampak", "Impact")} v={r.impact} />
          <Row k={tr("Perbaikan cepat", "Immediate action")} v={r.immediateAction} />
          <Row k={tr("Tindakan pencegahan", "Preventive action")} v={r.suggestion} />
          <Row k={tr("Usulan penanggung jawab", "Proposed person in charge")} v={r.proposedPic ? `${r.proposedPic.name ?? "-"}${r.proposedPic.jabatan ? `, ${r.proposedPic.jabatan}` : ""}` : null} />
        </tbody>
      </table>
      {r.photos.filter((p) => p.kind === "LAPORAN").length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {r.photos.filter((p) => p.kind === "LAPORAN").map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={`/api/foto/${p.id}`} alt="" className="aspect-[4/3] w-full rounded border border-ink-200 object-cover" />
          ))}
        </div>
      )}
      <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-brand-700">{tr("Verifikasi dan keputusan", "Verification and decision")}</h2>
      <table className="mt-2 w-full border-collapse">
        <tbody>
          <Row
            k={tr("Verifikasi", "Verification")}
            v={
              r.verifiedAt
                ? `${r.verificationResult === "VALID" ? tr("Valid", "Valid") : r.verificationResult === "REVISI" ? tr("Perlu revisi", "Revision required") : tr("Ditolak", "Rejected")} ${tr("oleh", "by")} ${r.verifier?.name}, ${dt(r.verifiedAt)}`
                : r.path === "B"
                  ? tr("Tidak diperlukan (jalur B)", "Not required (path B)")
                  : "-"
            }
          />
          <Row k={tr("Catatan verifikasi", "Verification note")} v={r.verificationNote} />
          {r.rejectReason && <Row k={tr("Alasan penolakan", "Rejection reason")} v={L.REJECT_REASON_LABEL[r.rejectReason as RejectReason] ?? r.rejectReason} />}
          <Row k={tr("Keputusan", "Decision")} v={r.decidedAt ? `${r.decisionResult === "SETUJU" ? tr("Disetujui", "Approved") : tr("Ditolak", "Rejected")} ${tr("oleh", "by")} ${r.decider?.name}, ${dt(r.decidedAt)}` : "-"} />
          <Row k={tr("Penanggung jawab", "Person in charge (PIC)")} v={r.picName ?? r.pic?.name} />
          <Row k={tr("Sumber daya", "Resources")} v={[r.resourceTenaga, r.resourceBiaya, r.resourceMaterial].filter(Boolean).join(" | ") || "-"} />
          <Row k={tr("Target selesai", "Target date")} v={fmtDate(r.targetDate, lang)} />
          <Row k={tr("Hierarki pengendalian", "Hierarchy of controls")} v={r.controlHierarchy ? L.CONTROL_LABEL[r.controlHierarchy as Control] : "-"} />
          <Row k={tr("Catatan keputusan", "Decision note")} v={r.decisionNote} />
        </tbody>
      </table>
      <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-brand-700">{tr("Perbaikan dan penutupan", "Corrective action and closure")}</h2>
      <table className="mt-2 w-full border-collapse">
        <tbody>
          <Row k={tr("Progres", "Progress")} v={`${r.progressPct}%`} />
          <Row k={tr("Perbaikan selesai", "Corrective action completed")} v={dt(r.completedAt)} />
          <Row k={tr("Catatan penyelesaian", "Completion note")} v={r.completionNote} />
          <Row k={tr("Ditutup", "Closed")} v={r.closedAt ? `${dt(r.closedAt)} ${tr("oleh", "by")} ${r.closer?.name}` : "-"} />
          <Row k={tr("Tepat waktu", "On time")} v={r.closedOnTime == null ? "-" : r.closedOnTime ? tr("Ya", "Yes") : tr("Terlambat", "Late")} />
          <Row k={tr("Poin pelapor", "Reporter points")} v={r.pointsAwarded} />
        </tbody>
      </table>
      <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-brand-700">{tr("Jejak laporan", "Report history")}</h2>
      <table className="mt-2 w-full border-collapse text-xs">
        <tbody>
          {r.events.map((e) => (
            <tr key={e.id}>
              <td className="w-40 border border-ink-200 px-2 py-1">{dt(e.createdAt)}</td>
              <td className="w-40 border border-ink-200 px-2 py-1">{L.EVENT_LABEL[e.type] ?? e.type}</td>
              <td className="border border-ink-200 px-2 py-1">{e.actor?.name ?? tr("Sistem", "System")}{e.note ? `: ${e.note}` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 grid grid-cols-3 gap-6 text-center text-xs">
        {[tr("Pelapor", "Reporter"), "Superintendent", "Manager"].map((t) => (
          <div key={t}>
            <div className="h-16 border-b border-ink-400" />
            <div className="mt-1 font-semibold">{t}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center text-[10px] text-ink-400">{tr("Dicetak", "Printed")} {dt(new Date())} {tr("oleh", "by")} {user.name} - PEDULI Apps - Developed by Nusa Safety</div>
    </div>
  );
}
