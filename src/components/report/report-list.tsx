import Link from "next/link";
import { ChevronRight, MapPin, Clock, AlertTriangle, Zap, ClipboardList } from "lucide-react";
import { StatusBadge, RiskBadge } from "./badges";
import { CATEGORY_LABEL, type Category } from "@/lib/constants";
import { fmtDateTime, relTime, cn } from "@/lib/format";
import { EmptyState } from "@/components/ui";

export type ReportRow = {
  id: string;
  number: string;
  category: string;
  riskLevel: string;
  status: string;
  description: string;
  createdAt: Date;
  areaLabel: string | null;
  escalated: boolean;
  outsideArea: boolean;
  dueVerifyAt: Date | null;
  dueDecideAt: Date | null;
  targetDate: Date | null;
  progressPct: number;
  area: { name: string } | null;
  reporter: { name: string | null; role: string };
  photos: { id: string }[];
};

export function isOverdue(r: ReportRow, now = new Date()) {
  if (r.status === "MENUNGGU_VERIFIKASI" && r.dueVerifyAt) return r.dueVerifyAt < now;
  if (r.status === "MENUNGGU_KEPUTUSAN" && r.dueDecideAt) return r.dueDecideAt < now;
  if ((r.status === "DALAM_PERBAIKAN" || r.status === "MENUNGGU_PENUTUPAN") && r.targetDate) return r.targetDate < now;
  return false;
}

export function ReportList({ reports, emptyTitle = "Belum ada laporan", emptyDesc }: { reports: ReportRow[]; emptyTitle?: string; emptyDesc?: string }) {
  if (!reports.length) return <EmptyState icon={<ClipboardList size={24} />} title={emptyTitle} description={emptyDesc} />;
  const now = new Date();
  return (
    <div className="space-y-2.5 stagger">
      {reports.map((r) => {
        const overdue = isOverdue(r, now);
        return (
          <Link key={r.id} href={`/laporan/${r.id}`} className="card card-hover flex gap-3 p-3 md:p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-100 md:h-20 md:w-20">
              {r.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/foto/${r.photos[0].id}?ukuran=kecil`} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-300">
                  <ClipboardList size={22} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold tabular-nums text-ink-500">
                  {r.number}
                  {r.escalated && <Zap size={13} className="shrink-0 text-orange" aria-label="Dieskalasi ke Manager" />}
                  {overdue && <AlertTriangle size={13} className="shrink-0 text-red" aria-label="Lewat batas waktu" />}
                </span>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-ink-900">{r.description}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                <RiskBadge risk={r.riskLevel} />
                <span>{CATEGORY_LABEL[r.category as Category] ?? r.category}</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} /> {r.area?.name ?? "-"}{r.areaLabel ? ` - ${r.areaLabel}` : ""}
                  {r.outsideArea && <span className="text-[#8a6a0a]"> (di luar area)</span>}
                </span>
                <span className="inline-flex items-center gap-1" title={fmtDateTime(r.createdAt)}>
                  <Clock size={12} /> {relTime(r.createdAt)}
                </span>
                <span className="hidden sm:inline">oleh {r.reporter.name}</span>
              </div>
              {(r.status === "DALAM_PERBAIKAN" || r.status === "MENUNGGU_PENUTUPAN") && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="progress flex-1">
                    <span style={{ width: `${r.progressPct}%` }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-ink-500">{r.progressPct}%</span>
                </div>
              )}
            </div>
            <ChevronRight size={18} className={cn("hidden self-center text-ink-300 sm:block")} />
          </Link>
        );
      })}
    </div>
  );
}
