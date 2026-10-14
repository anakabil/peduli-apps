import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { reportScope } from "@/lib/workflow";
import { PageHeader } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";
import { ReportFilters } from "@/components/report/filters";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Laporan" };
const PAGE = 20;

export default async function LaporanPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.ReportWhereInput = { AND: [reportScope(user)] };
  const and = where.AND as Prisma.ReportWhereInput[];
  if (sp.status) and.push({ status: sp.status });
  if (sp.category) and.push({ category: sp.category });
  if (sp.risk) and.push({ riskLevel: sp.risk });
  if (sp.area) and.push({ areaId: sp.area });
  if (sp.q) and.push({ OR: [{ number: { contains: sp.q } }, { description: { contains: sp.q } }, { areaLabel: { contains: sp.q } }] });

  const [reports, total, areas] = await Promise.all([
    db.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { area: { select: { name: true } }, reporter: { select: { name: true, role: true } }, photos: { select: { id: true }, take: 1, where: { kind: "LAPORAN" } } },
    }),
    db.report.count({ where }),
    db.area.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const mine = user.role === "PENGAWAS";

  return (
    <div>
      <PageHeader
        eyebrow={mine ? "Laporan saya" : "Semua laporan"}
        title="Laporan bahaya"
        description={`${total} laporan ${mine ? "yang Anda buat atau Anda tangani" : "dalam lingkup akses Anda"}.`}
        actions={
          <Link href="/lapor" className="btn-primary">
            <PlusCircle size={16} /> Lapor bahaya
          </Link>
        }
      />
      <Suspense>
        <ReportFilters areas={areas} />
      </Suspense>
      <ReportList reports={reports} emptyDesc="Ubah filter atau buat laporan baru." />
      {pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link className="btn-secondary btn-sm" href={`?${new URLSearchParams({ ...sp, page: String(page - 1) } as Record<string, string>)}`}>
              Sebelumnya
            </Link>
          )}
          <span className="text-ink-500">
            Halaman {page} dari {pages}
          </span>
          {page < pages && (
            <Link className="btn-secondary btn-sm" href={`?${new URLSearchParams({ ...sp, page: String(page + 1) } as Record<string, string>)}`}>
              Berikutnya
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
