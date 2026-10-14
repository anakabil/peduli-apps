import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";

export const metadata = { title: "Verifikasi" };

export default async function VerifikasiPage() {
  const user = await requireUser(["SUPERINTENDENT", "ADMIN"]);
  const where =
    user.role === "ADMIN"
      ? { status: "MENUNGGU_VERIFIKASI" }
      : { status: "MENUNGGU_VERIFIKASI", OR: [{ reporter: { atasanId: user.id } }, ...(user.areaId ? [{ reporter: { areaId: user.areaId } }] : []), { reporter: { atasanId: null } }] };
  const reports = await db.report.findMany({
    where,
    orderBy: [{ escalated: "desc" }, { createdAt: "asc" }],
    include: { area: { select: { name: true } }, reporter: { select: { name: true, role: true } }, photos: { select: { id: true }, take: 1 } },
  });
  return (
    <div>
      <PageHeader eyebrow="Tugas Superintendent" title="Antrean verifikasi" description={`${reports.length} laporan Pengawas menunggu verifikasi Anda. Periksa foto, lokasi, waktu, dan kelengkapan uraian, lalu tetapkan valid, revisi, atau tolak.`} />
      <ReportList reports={reports} emptyTitle="Tidak ada laporan menunggu" emptyDesc="Semua laporan Pengawas di lingkup Anda sudah diverifikasi." />
    </div>
  );
}
