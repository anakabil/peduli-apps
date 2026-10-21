import { ThumbsUp, Wrench, ShieldAlert } from "lucide-react";
import { STOP_GROUPS, ACTIVITY_LABEL } from "@/lib/constants";

type StopData = {
  stopItems: string[];
  activities: string[];
  safeActs: string | null;
  safeEncourage: string | null;
  immediateAction: string | null;
};

/** Ringkasan kartu STOP (DuPont) pada halaman detail laporan */
export function StopCardSummary({ report }: { report: StopData }) {
  const groups = STOP_GROUPS.map((g) => ({ ...g, picked: g.items.filter((i) => report.stopItems.includes(i.key)) })).filter((g) => g.picked.length > 0);
  const hasAny = report.activities.length > 0 || groups.length > 0 || report.safeActs || report.safeEncourage || report.immediateAction;
  if (!hasAny) return null;
  return (
    <div>
      <div className="section-title mb-2">Kartu STOP</div>
      <div className="space-y-3 rounded-xl border border-ink-200 p-4">
        {report.activities.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-ink-500">Aktivitas yang diobservasi</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {report.activities.map((a) => (
                <span key={a} className="badge bg-brand-50 text-brand-800">{ACTIVITY_LABEL[a] ?? a}</span>
              ))}
            </div>
          </div>
        )}
        {groups.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-ink-500">Daftar periksa tidak aman</div>
            <div className="mt-1.5 space-y-2">
              {groups.map((g) => (
                <div key={g.key}>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-ink-700">{g.label}</div>
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-sm text-ink-800">
                    {g.picked.map((i) => (
                      <li key={i.key}>{i.label}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        {(report.safeActs || report.safeEncourage) && (
          <div className="rounded-lg bg-brand-50/60 px-3 py-2 text-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700"><ThumbsUp size={13} /> Tindakan aman</div>
            {report.safeActs && <p className="mt-1 text-ink-800">{report.safeActs}</p>}
            {report.safeEncourage && <p className="mt-1 text-ink-600"><span className="font-semibold">Dorongan:</span> {report.safeEncourage}</p>}
          </div>
        )}
        {report.immediateAction && (
          <div className="rounded-lg bg-ink-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-700"><Wrench size={13} /> Perbaikan yang langsung dilakukan</div>
            <p className="mt-1 text-ink-800">{report.immediateAction}</p>
          </div>
        )}
        {groups.length === 0 && report.activities.length > 0 && !report.immediateAction && (
          <div className="flex items-center gap-1.5 text-xs text-ink-500"><ShieldAlert size={13} /> Tidak ada item daftar periksa yang dicentang.</div>
        )}
      </div>
    </div>
  );
}
