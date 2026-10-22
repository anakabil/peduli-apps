import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";

export const metadata = { title: "Keputusan" };

function SectionHeading({ children, count, className = "" }: { children: React.ReactNode; count: number; className?: string }) {
  return (
    <h2 className={`mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink-800 ${className}`}>
      {children}
      <span className="badge badge-neutral tabular-nums">{count.toLocaleString("id-ID")}</span>
    </h2>
  );
}

export default async function KeputusanPage() {
  const user = await requireUser(["MANAGER", "ADMIN"]);
  const settings = await getSettings();
  const reports = await db.report.findMany({
    where: { status: "MENUNGGU_KEPUTUSAN", ...(user.role === "MANAGER" && settings.managerPeerReview ? { reporterId: { not: user.id } } : {}) },
    orderBy: [{ escalated: "desc" }, { createdAt: "asc" }],
    include: { area: { select: { name: true, managerId: true } }, reporter: { select: { name: true, role: true } }, photos: { select: { id: true }, take: 1 } },
  });
  const mine = reports.filter((r) => r.area?.managerId === user.id);
  const others = reports.filter((r) => r.area?.managerId !== user.id);
  const n = reports.length;
  const split = user.role === "MANAGER" && mine.length > 0;
  return (
    <div>
      <PageHeader
        eyebrow="Tugas Manager"
        title="Antrean keputusan"
        description={
          n > 0
            ? `${n.toLocaleString("id-ID")} laporan menunggu keputusan: setujui dengan penanggung jawab, sumber daya, dan target, atau tolak dengan alasan.`
            : "Tidak ada laporan terverifikasi yang menunggu keputusan Anda saat ini."
        }
      />
      {n === 0 ? (
        // Antrean kosong: kartu tenang, bukan kotak putus-putus
        <div className="card flex flex-col items-center px-6 py-12 text-center anim-fade-in">
          <div className="mb-3 rounded-full bg-brand-50 p-3 text-brand-600">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-base font-bold text-ink-900">Antrean bersih</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-500">Semua laporan terverifikasi sudah diputuskan.</p>
          <Link href="/tindak-lanjut" className="btn-secondary mt-5 min-h-11 md:min-h-0">
            Pantau tindak lanjut
          </Link>
        </div>
      ) : split ? (
        <>
          <SectionHeading count={mine.length}>Area yang Anda kelola</SectionHeading>
          <ReportList reports={mine} />
          <SectionHeading count={others.length} className="mt-7">Area lain</SectionHeading>
          {others.length > 0 ? <ReportList reports={others} /> : <p className="card px-4 py-3.5 text-sm text-ink-500">Tidak ada laporan dari area lain yang menunggu keputusan.</p>}
        </>
      ) : (
        <ReportList reports={reports} />
      )}
    </div>
  );
}
