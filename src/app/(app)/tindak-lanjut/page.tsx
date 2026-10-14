import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";

export const metadata = { title: "Tindak lanjut" };

export default async function TindakLanjutPage() {
  const user = await requireUser(["MANAGER", "SUPERINTENDENT", "PENGAWAS", "ADMIN"]);
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
      <PageHeader eyebrow="Perbaikan dan penutupan" title="Tindak lanjut" description="Pantau perbaikan yang berjalan, perbarui progres, dan verifikasi hasil sebelum penutupan." />
      {closing.length > 0 && (
        <>
          <div className="section-title mb-2">Menunggu penutupan ({closing.length})</div>
          <ReportList reports={closing} />
          <div className="mt-6" />
        </>
      )}
      <div className="section-title mb-2">Dalam perbaikan ({fixing.length})</div>
      <ReportList reports={fixing} emptyTitle="Tidak ada perbaikan berjalan" emptyDesc="Semua tindak lanjut sudah ditutup." />
    </div>
  );
}
