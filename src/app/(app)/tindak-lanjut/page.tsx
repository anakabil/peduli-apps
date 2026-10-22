import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";

export const metadata = { title: "Tindak lanjut" };

function SectionHeading({ children, count, className = "" }: { children: React.ReactNode; count: number; className?: string }) {
  return (
    <h2 className={`mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink-800 ${className}`}>
      {children}
      <span className="badge badge-neutral tabular-nums">{count.toLocaleString("id-ID")}</span>
    </h2>
  );
}

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
      <PageHeader
        eyebrow="Perbaikan dan penutupan"
        title="Tindak lanjut"
        description={
          reports.length > 0
            ? "Pantau perbaikan yang berjalan, perbarui progres, dan verifikasi hasil sebelum penutupan."
            : "Tidak ada perbaikan yang berjalan atau menunggu penutupan saat ini."
        }
      />
      {reports.length === 0 ? (
        // Antrean kosong: kartu tenang, bukan kotak putus-putus
        <div className="card flex flex-col items-center px-6 py-12 text-center anim-fade-in">
          <div className="mb-3 rounded-full bg-brand-50 p-3 text-brand-600">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-base font-bold text-ink-900">Antrean bersih</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-500">Semua tindak lanjut sudah ditutup.</p>
          <Link href="/laporan" className="btn-secondary mt-5 min-h-11 md:min-h-0">
            Lihat semua laporan
          </Link>
        </div>
      ) : (
        <>
          {closing.length > 0 && (
            <div className="mb-7">
              <SectionHeading count={closing.length}>Menunggu penutupan</SectionHeading>
              <ReportList reports={closing} />
            </div>
          )}
          <SectionHeading count={fixing.length}>Dalam perbaikan</SectionHeading>
          {fixing.length > 0 ? <ReportList reports={fixing} /> : <p className="card px-4 py-3.5 text-sm text-ink-500">Tidak ada perbaikan yang sedang berjalan.</p>}
        </>
      )}
    </div>
  );
}
