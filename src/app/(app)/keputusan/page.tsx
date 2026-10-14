import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";

export const metadata = { title: "Keputusan" };

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
  return (
    <div>
      <PageHeader eyebrow="Tugas Manager" title="Antrean keputusan" description={`${reports.length} laporan menunggu keputusan: setujui dengan penanggung jawab, sumber daya, dan target, atau tolak dengan alasan.`} />
      {user.role === "MANAGER" && mine.length > 0 && (
        <>
          <div className="section-title mb-2">Area yang Anda kelola</div>
          <ReportList reports={mine} />
          <div className="section-title mb-2 mt-6">Area lain</div>
        </>
      )}
      <ReportList reports={user.role === "MANAGER" && mine.length > 0 ? others : reports} emptyTitle="Tidak ada laporan menunggu keputusan" emptyDesc="Semua laporan terverifikasi sudah diputuskan." />
    </div>
  );
}
