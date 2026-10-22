import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";
import { verifiableWhere } from "@/lib/workflow";

export const metadata = { title: "Verifikasi" };

export default async function VerifikasiPage() {
  const user = await requireUser(["SUPERINTENDENT", "ADMIN"]);
  const where = user.role === "ADMIN" ? { status: "MENUNGGU_VERIFIKASI" } : verifiableWhere(user);
  const reports = await db.report.findMany({
    where,
    orderBy: [{ escalated: "desc" }, { createdAt: "asc" }],
    include: { area: { select: { name: true } }, reporter: { select: { name: true, role: true } }, photos: { select: { id: true }, take: 1 } },
  });
  const n = reports.length;
  return (
    <div>
      <PageHeader
        eyebrow="Tugas Superintendent"
        title="Antrean verifikasi"
        description={
          n > 0
            ? `${n.toLocaleString("id-ID")} laporan Pengawas menunggu verifikasi Anda. Periksa foto, lokasi, waktu, dan kelengkapan uraian, lalu tetapkan valid, revisi, atau tolak.`
            : "Tidak ada laporan Pengawas yang menunggu verifikasi Anda saat ini."
        }
      />
      {n > 0 ? (
        <ReportList reports={reports} />
      ) : (
        // Antrean kosong: kartu tenang, bukan kotak putus-putus
        <div className="card flex flex-col items-center px-6 py-12 text-center anim-fade-in">
          <div className="mb-3 rounded-full bg-brand-50 p-3 text-brand-600">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-base font-bold text-ink-900">Antrean bersih</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-500">Semua laporan Pengawas di lingkup Anda sudah diverifikasi.</p>
          <Link href="/tindak-lanjut" className="btn-secondary mt-5 min-h-11 md:min-h-0">
            Pantau tindak lanjut
          </Link>
        </div>
      )}
    </div>
  );
}
