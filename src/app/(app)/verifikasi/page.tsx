import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";
import { verifiableWhere } from "@/lib/workflow";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Verifikasi", "Verification") };
}

export default async function VerifikasiPage() {
  const user = await requireUser(["SUPERINTENDENT", "ADMIN"]);
  const { tr } = await getTr();
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
        eyebrow={tr("Tugas Superintendent", "Superintendent tasks")}
        title={tr("Antrean verifikasi", "Verification queue")}
        description={
          n > 0
            ? tr(
                `${n.toLocaleString("id-ID")} laporan Pengawas menunggu verifikasi Anda. Periksa foto, lokasi, waktu, dan kelengkapan uraian, lalu tetapkan valid, revisi, atau tolak.`,
                `${n.toLocaleString("en-US")} Supervisor report${n === 1 ? "" : "s"} awaiting your verification. Check the photos, location, time, and completeness of the description, then mark as valid, request revision, or reject.`
              )
            : tr("Tidak ada laporan Pengawas yang menunggu verifikasi Anda saat ini.", "No Supervisor reports are awaiting your verification at this time.")
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
          <h2 className="text-base font-bold text-ink-900">{tr("Antrean bersih", "Queue is clear")}</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-500">{tr("Semua laporan Pengawas di lingkup Anda sudah diverifikasi.", "All Supervisor reports within your scope have been verified.")}</p>
          <Link href="/tindak-lanjut" className="btn-secondary mt-5 min-h-11 md:min-h-0">
            {tr("Pantau tindak lanjut", "Monitor follow-up")}
          </Link>
        </div>
      )}
    </div>
  );
}
