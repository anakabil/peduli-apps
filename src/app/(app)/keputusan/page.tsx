import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";
import type { Lang } from "@/lib/i18n";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Keputusan", "Decision") };
}

function SectionHeading({ children, count, className = "", lang = "id" }: { children: React.ReactNode; count: number; className?: string; lang?: Lang }) {
  return (
    <h2 className={`mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink-800 ${className}`}>
      {children}
      <span className="badge badge-neutral tabular-nums">{count.toLocaleString(lang === "en" ? "en-US" : "id-ID")}</span>
    </h2>
  );
}

export default async function KeputusanPage() {
  const user = await requireUser(["MANAGER", "ADMIN"]);
  const { lang, tr } = await getTr();
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
        eyebrow={tr("Tugas Manager", "Manager tasks")}
        title={tr("Antrean keputusan", "Decision queue")}
        description={
          n > 0
            ? tr(
                `${n.toLocaleString("id-ID")} laporan menunggu keputusan: setujui dengan penanggung jawab, sumber daya, dan target, atau tolak dengan alasan.`,
                `${n.toLocaleString("en-US")} report${n === 1 ? "" : "s"} awaiting decision: approve with a person in charge, resources, and a target date, or reject with a reason.`
              )
            : tr("Tidak ada laporan terverifikasi yang menunggu keputusan Anda saat ini.", "No verified reports are awaiting your decision at this time.")
        }
      />
      {n === 0 ? (
        // Antrean kosong: kartu tenang, bukan kotak putus-putus
        <div className="card flex flex-col items-center px-6 py-12 text-center anim-fade-in">
          <div className="mb-3 rounded-full bg-brand-50 p-3 text-brand-600">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-base font-bold text-ink-900">{tr("Antrean bersih", "Queue is clear")}</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-500">{tr("Semua laporan terverifikasi sudah diputuskan.", "All verified reports have been decided.")}</p>
          <Link href="/tindak-lanjut" className="btn-secondary mt-5 min-h-11 md:min-h-0">
            {tr("Pantau tindak lanjut", "Monitor follow-up")}
          </Link>
        </div>
      ) : split ? (
        <>
          <SectionHeading count={mine.length} lang={lang}>{tr("Area yang Anda kelola", "Areas you manage")}</SectionHeading>
          <ReportList reports={mine} />
          <SectionHeading count={others.length} className="mt-7" lang={lang}>{tr("Area lain", "Other areas")}</SectionHeading>
          {others.length > 0 ? <ReportList reports={others} /> : <p className="card px-4 py-3.5 text-sm text-ink-500">{tr("Tidak ada laporan dari area lain yang menunggu keputusan.", "No reports from other areas are awaiting decision.")}</p>}
        </>
      ) : (
        <ReportList reports={reports} />
      )}
    </div>
  );
}
