import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";
import type { Lang } from "@/lib/i18n";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Tindak lanjut", "Follow-up") };
}

function SectionHeading({ children, count, className = "", lang = "id" }: { children: React.ReactNode; count: number; className?: string; lang?: Lang }) {
  return (
    <h2 className={`mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink-800 ${className}`}>
      {children}
      <span className="badge badge-neutral tabular-nums">{count.toLocaleString(lang === "en" ? "en-US" : "id-ID")}</span>
    </h2>
  );
}

export default async function TindakLanjutPage() {
  const user = await requireUser(["MANAGER", "SUPERINTENDENT", "PENGAWAS", "ADMIN"]);
  const { lang, tr } = await getTr();
  const base = { status: { in: ["DALAM_PERBAIKAN", "MENUNGGU_PENUTUPAN"] } };
  const where = user.role === "ADMIN" || user.role === "MANAGER" ? base : { ...base, OR: [{ picId: user.id }, { verifierId: user.id }, { reporterId: user.id }] };
  const reports = await db.report.findMany({
    where,
    orderBy: [{ targetDate: "asc" }],
    include: { area: { select: { name: true } }, reporter: { select: { name: true, role: true } }, photos: { select: { id: true }, take: 1 } },
  });
  const closing = reports.filter((r) => r.status === "MENUNGGU_PENUTUPAN");
  const fixing = reports.filter((r) => r.status === "DALAM_PERBAIKAN");
  return (
    <div>
      <PageHeader
        eyebrow={tr("Perbaikan dan penutupan", "Corrective action and closure")}
        title={tr("Tindak lanjut", "Follow-up")}
        description={
          reports.length > 0
            ? tr("Pantau perbaikan yang berjalan, perbarui progres, dan verifikasi hasil sebelum penutupan.", "Monitor ongoing corrective actions, update progress, and verify results before closure.")
            : tr("Tidak ada perbaikan yang berjalan atau menunggu penutupan saat ini.", "No corrective actions are in progress or awaiting closure at this time.")
        }
      />
      {reports.length === 0 ? (
        // Antrean kosong: kartu tenang, bukan kotak putus-putus
        <div className="card flex flex-col items-center px-6 py-12 text-center anim-fade-in">
          <div className="mb-3 rounded-full bg-brand-50 p-3 text-brand-600">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-base font-bold text-ink-900">{tr("Antrean bersih", "Queue is clear")}</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-500">{tr("Semua tindak lanjut sudah ditutup.", "All follow-ups have been closed.")}</p>
          <Link href="/laporan" className="btn-secondary mt-5 min-h-11 md:min-h-0">
            {tr("Lihat semua laporan", "View all reports")}
          </Link>
        </div>
      ) : (
        <>
          {closing.length > 0 && (
            <div className="mb-7">
              <SectionHeading count={closing.length} lang={lang}>{tr("Menunggu penutupan", "Awaiting closure")}</SectionHeading>
              <ReportList reports={closing} />
            </div>
          )}
          <SectionHeading count={fixing.length} lang={lang}>{tr("Dalam perbaikan", "Corrective action in progress")}</SectionHeading>
          {fixing.length > 0 ? <ReportList reports={fixing} /> : <p className="card px-4 py-3.5 text-sm text-ink-500">{tr("Tidak ada perbaikan yang sedang berjalan.", "No corrective actions are in progress.")}</p>}
        </>
      )}
    </div>
  );
}
