import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { reportScope } from "@/lib/workflow";
import { fmtDateTime, fmtDate } from "@/lib/format";
import { CATEGORY_LABEL, RISK_LABEL, STATUS_LABEL, CONTROL_LABEL, ROLE_LABEL, EVENT_LABEL, COMPANY_NAME, STOP_GROUPS, ACTIVITY_LABEL, type Category, type Risk, type Status, type Control, type Role } from "@/lib/constants";
import { PrintButton } from "@/components/print-button";
import { GysLogo, PeduliLogo } from "@/components/brand";

export const metadata = { title: "Cetak laporan" };

export default async function PrintReport({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const r = await db.report.findFirst({
    where: { AND: [{ id }, reportScope(user)] },
    include: { reporter: true, area: true, verifier: true, decider: true, pic: true, closer: true, photos: { select: { id: true, kind: true } }, events: { include: { actor: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!r) notFound();
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <tr>
      <td className="w-48 border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-600">{k}</td>
      <td className="border border-ink-200 px-3 py-1.5 text-sm">{v ?? "-"}</td>
    </tr>
  );
  return (
    <div className="mx-auto max-w-3xl bg-white p-6 md:p-8 card">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton />
      </div>
      <div className="flex items-center justify-between border-b-2 border-brand-700 pb-3">
        <div className="flex items-center gap-3">
          <GysLogo size={44} />
          <div>
            <div className="text-sm font-bold">{COMPANY_NAME}</div>
            <div className="text-xs text-ink-500">Formulir Laporan Bahaya dan Upaya Pengendalian</div>
          </div>
        </div>
        <PeduliLogo height={36} />
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <h1 className="text-lg font-bold">Laporan {r.number}</h1>
        <span className="text-sm">Status: <b>{STATUS_LABEL[r.status as Status]}</b></span>
      </div>
      <table className="mt-3 w-full border-collapse">
        <tbody>
          <Row k="Pelapor" v={`${r.reporter.name} (${ROLE_LABEL[r.reporter.role as Role]}${r.reporter.jabatan ? `, ${r.reporter.jabatan}` : ""})`} />
          <Row k="Cap waktu server" v={fmtDateTime(r.createdAt)} />
          <Row k="Area kerja" v={`${r.area?.name ?? "-"}${r.areaLabel ? ` - ${r.areaLabel}` : ""}`} />
          <Row k="Koordinat" v={r.lat != null ? `${r.lat.toFixed(5)}, ${r.lng?.toFixed(5)} (akurasi ${Math.round(r.accuracyM ?? 0)} m)` : "-"} />
          <Row k="Kategori" v={CATEGORY_LABEL[r.category as Category]} />
          <Row k="Risiko awal" v={RISK_LABEL[r.riskLevel as Risk]} />
          <Row k="Aktivitas diobservasi" v={r.activities.map((a) => ACTIVITY_LABEL[a] ?? a).join(", ") || "-"} />
          <Row k="Tindakan aman" v={r.safeActs} />
          <Row k="Dorongan kinerja aman" v={r.safeEncourage} />
          <Row k="Tindakan tidak aman" v={r.description} />
          <Row k="Perbaikan segera" v={r.immediateAction} />
          <Row k="Tindakan pencegahan" v={r.suggestion} />
        </tbody>
      </table>
      <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-brand-700">Daftar periksa kartu STOP</h2>
      <table className="mt-2 w-full border-collapse">
        <tbody>
          {STOP_GROUPS.map((g) => {
            const picked = g.items.filter((i) => r.stopItems.includes(i.key));
            return <Row key={g.key} k={g.label} v={picked.length ? picked.map((i) => i.label).join("; ") : "-"} />;
          })}
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
      <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-brand-700">Verifikasi dan keputusan</h2>
      <table className="mt-2 w-full border-collapse">
        <tbody>
          <Row k="Verifikasi" v={r.verifiedAt ? `${r.verificationResult} oleh ${r.verifier?.name}, ${fmtDateTime(r.verifiedAt)}` : r.path === "B" ? "Tidak diperlukan (jalur B)" : "-"} />
          <Row k="Catatan verifikasi" v={r.verificationNote} />
          <Row k="Keputusan" v={r.decidedAt ? `${r.decisionResult} oleh ${r.decider?.name}, ${fmtDateTime(r.decidedAt)}` : "-"} />
          <Row k="Penanggung jawab" v={r.picName ?? r.pic?.name} />
          <Row k="Sumber daya" v={[r.resourceTenaga, r.resourceBiaya, r.resourceMaterial].filter(Boolean).join(" | ") || "-"} />
          <Row k="Target selesai" v={fmtDate(r.targetDate)} />
          <Row k="Hierarki pengendalian" v={r.controlHierarchy ? CONTROL_LABEL[r.controlHierarchy as Control] : "-"} />
          <Row k="Catatan keputusan" v={r.decisionNote} />
        </tbody>
      </table>
      <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-brand-700">Perbaikan dan penutupan</h2>
      <table className="mt-2 w-full border-collapse">
        <tbody>
          <Row k="Progres" v={`${r.progressPct}%`} />
          <Row k="Perbaikan selesai" v={fmtDateTime(r.completedAt)} />
          <Row k="Catatan penyelesaian" v={r.completionNote} />
          <Row k="Ditutup" v={r.closedAt ? `${fmtDateTime(r.closedAt)} oleh ${r.closer?.name}` : "-"} />
          <Row k="Tepat waktu" v={r.closedOnTime == null ? "-" : r.closedOnTime ? "Ya" : "Terlambat"} />
          <Row k="Poin pelapor" v={r.pointsAwarded} />
        </tbody>
      </table>
      <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-brand-700">Jejak laporan</h2>
      <table className="mt-2 w-full border-collapse text-xs">
        <tbody>
          {r.events.map((e) => (
            <tr key={e.id}>
              <td className="w-40 border border-ink-200 px-2 py-1">{fmtDateTime(e.createdAt)}</td>
              <td className="w-40 border border-ink-200 px-2 py-1">{EVENT_LABEL[e.type] ?? e.type}</td>
              <td className="border border-ink-200 px-2 py-1">{e.actor?.name ?? "Sistem"}{e.note ? `: ${e.note}` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 grid grid-cols-3 gap-6 text-center text-xs">
        {["Pelapor", "Superintendent", "Manager"].map((t) => (
          <div key={t}>
            <div className="h-16 border-b border-ink-400" />
            <div className="mt-1 font-semibold">{t}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center text-[10px] text-ink-400">Dicetak {fmtDateTime(new Date())} oleh {user.name} - PEDULI Apps - Developed by Nusa Safety</div>
    </div>
  );
}
