import { labels, type Role } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { makeTr, type Lang } from "@/lib/i18n";

export function Timeline({ events, lang = "id" }: { events: Array<{ id: string; type: string; note: string | null; createdAt: Date; actor: { name: string | null; role: string } | null }>; lang?: Lang }) {
  const tr = makeTr(lang);
  const L = labels(lang);
  if (!events.length) return <p className="text-sm text-ink-400">{tr("Belum ada riwayat.", "No history yet.")}</p>;
  return (
    <ol className="relative space-y-4 border-l border-ink-200 pl-5">
      {events.map((e, i) => (
        <li key={e.id} className="relative anim-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
          <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${i === events.length - 1 ? "bg-brand-600" : "bg-ink-300"}`} />
          <div className="text-sm font-semibold text-ink-800">{L.EVENT_LABEL[e.type] ?? e.type}</div>
          {e.note && <div className="text-sm text-ink-600">{e.note}</div>}
          <div className="mt-0.5 text-xs text-ink-400">
            {e.actor ? `${e.actor.name} (${L.ROLE_LABEL[e.actor.role as Role] ?? e.actor.role})` : tr("Sistem", "System")} - {fmtDateTime(e.createdAt, false, lang)}
          </div>
        </li>
      ))}
    </ol>
  );
}
