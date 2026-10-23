import Link from "next/link";
import { PlusCircle, SearchX, X } from "lucide-react";
import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { reportScope } from "@/lib/workflow";
import { PageHeader, EmptyState } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";
import { ReportFilters } from "@/components/report/filters";
import { OPEN_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Laporan" };
const PAGE = 20;

// Tab ringkas di atas daftar. Laporan ditolak sengaja punya tab sendiri agar tetap mudah ditelaah.
const TABS = [
  { key: "", label: "Semua", statuses: null },
  { key: "berjalan", label: "Berjalan", statuses: OPEN_STATUSES as string[] },
  { key: "selesai", label: "Selesai", statuses: ["SELESAI"] },
  { key: "ditolak", label: "Ditolak", statuses: ["DITOLAK"] },
] as const;

export default async function LaporanPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.ReportWhereInput = { AND: [reportScope(user)] };
  const and = where.AND as Prisma.ReportWhereInput[];
  const tab = TABS.find((t) => t.key === (sp.tab ?? "")) ?? TABS[0];
  if (tab.statuses) and.push({ status: { in: [...tab.statuses] } });
  if (sp.status) and.push({ status: sp.status });
  if (sp.category) and.push({ category: sp.category });
  if (sp.risk) and.push({ riskLevel: sp.risk });
  if (sp.area) and.push({ areaId: sp.area });
  if (sp.q) and.push({ OR: [{ number: { contains: sp.q, mode: "insensitive" as const } }, { description: { contains: sp.q, mode: "insensitive" as const } }, { areaLabel: { contains: sp.q, mode: "insensitive" as const } }] });

  const [reports, total, areas, byStatus] = await Promise.all([
    db.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { area: { select: { name: true } }, reporter: { select: { name: true, role: true } }, photos: { select: { id: true }, take: 1, where: { kind: "LAPORAN" } } },
    }),
    db.report.count({ where }),
    db.area.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.report.groupBy({ by: ["status"], where: reportScope(user), _count: { _all: true } }),
  ]);
  const tabCount = (t: (typeof TABS)[number]) => byStatus.filter((b) => !t.statuses || (t.statuses as readonly string[]).includes(b.status)).reduce((n, b) => n + b._count._all, 0);
  const tabHref = (key: string) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "tab" && k !== "page") as [string, string][]);
    if (key) p.set("tab", key);
    const q = p.toString();
    return q ? `/laporan?${q}` : "/laporan";
  };
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const mine = user.role === "PENGAWAS";
  const filtered = Boolean(sp.tab || sp.status || sp.category || sp.risk || sp.area || sp.q);
  const count = total.toLocaleString("id-ID");

  return (
    <div>
      <PageHeader
        eyebrow={mine ? "Laporan saya" : "Semua laporan"}
        title="Laporan bahaya"
        description={filtered ? `${count} laporan cocok dengan kriteria Anda.` : `${count} laporan ${mine ? "yang Anda buat atau Anda tangani" : "dalam lingkup akses Anda"}.`}
        actions={
          <Link href="/lapor" className="btn-primary">
            <PlusCircle size={16} /> Lapor bahaya
          </Link>
        }
      />
      <nav aria-label="Status laporan" className="no-print mb-3 grid grid-cols-4 gap-1.5 sm:flex sm:gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={tabHref(t.key)} aria-current={t.key === tab.key ? "page" : undefined} className={cn("chip min-h-11 justify-center gap-1 px-2 sm:gap-1.5 sm:px-3 md:min-h-0", t.key === tab.key && "chip-active")}>
            {t.label}
            <span className={cn("tabular-nums text-xs", t.key === tab.key ? "text-white/80" : "text-ink-500")}>{tabCount(t).toLocaleString("id-ID")}</span>
          </Link>
        ))}
      </nav>
      <Suspense>
        <ReportFilters areas={areas} />
      </Suspense>
      {filtered && reports.length === 0 ? (
        <EmptyState
          icon={<SearchX size={24} />}
          title={sp.q ? `Tidak ada hasil untuk “${sp.q}”` : "Tidak ada laporan yang cocok dengan filter"}
          description={sp.q ? "Periksa ejaan, gunakan kata kunci lain, atau hapus filter yang aktif." : "Longgarkan filter untuk melihat lebih banyak laporan."}
          action={
            <Link href="/laporan" className="btn-secondary min-h-11 md:min-h-0">
              <X size={16} /> Hapus filter
            </Link>
          }
        />
      ) : (
        <ReportList reports={reports} emptyDesc="Laporan bahaya yang Anda buat atau tangani akan tampil di sini." />
      )}
      {pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link className="btn-secondary btn-sm min-h-11 md:min-h-0" href={`?${new URLSearchParams({ ...sp, page: String(page - 1) } as Record<string, string>)}`}>
              Sebelumnya
            </Link>
          )}
          <span className="tabular-nums text-ink-500">
            Halaman {page} dari {pages}
          </span>
          {page < pages && (
            <Link className="btn-secondary btn-sm min-h-11 md:min-h-0" href={`?${new URLSearchParams({ ...sp, page: String(page + 1) } as Record<string, string>)}`}>
              Berikutnya
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
