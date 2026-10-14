"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays } from "lucide-react";

export function PeriodPicker({ areas, mode }: { areas: Array<{ id: string; name: string }>; mode: "bulan" | "tahun" | "rentang" }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();
  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const go = (next: Record<string, string>) => {
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    start(() => router.replace(`${pathname}?${p.toString()}`));
  };
  const area = sp.get("area") ?? "";

  return (
    <div className="no-print card mb-5 flex flex-wrap items-center gap-2 p-3 anim-fade-in">
      <CalendarDays size={16} className="text-brand-600" />
      <div className="flex rounded-lg border border-ink-200 p-0.5 text-xs font-semibold">
        {(["bulan", "tahun", "rentang"] as const).map((m) => (
          <button key={m} onClick={() => go(m === "bulan" ? { bulan: curMonth, area } : m === "tahun" ? { tahun: String(now.getFullYear()), area } : { dari: `${now.getFullYear()}-01-01`, sampai: now.toISOString().slice(0, 10), area })} className={`rounded-md px-3 py-1.5 capitalize transition-colors ${mode === m ? "bg-brand-700 text-white" : "text-ink-600 hover:bg-ink-100"}`}>
            {m}
          </button>
        ))}
      </div>
      {mode === "bulan" && <input type="month" className="input w-auto" value={sp.get("bulan") ?? curMonth} max={curMonth} onChange={(e) => go({ bulan: e.target.value, area })} />}
      {mode === "tahun" && (
        <select className="input w-auto" value={sp.get("tahun") ?? String(now.getFullYear())} onChange={(e) => go({ tahun: e.target.value, area })}>
          {[0, 1, 2, 3].map((i) => (
            <option key={i} value={now.getFullYear() - i}>{now.getFullYear() - i}</option>
          ))}
        </select>
      )}
      {mode === "rentang" && (
        <>
          <input type="date" className="input w-auto" value={sp.get("dari") ?? ""} onChange={(e) => go({ dari: e.target.value, sampai: sp.get("sampai") ?? "", area })} />
          <span className="text-xs text-ink-500">s.d.</span>
          <input type="date" className="input w-auto" value={sp.get("sampai") ?? ""} onChange={(e) => go({ dari: sp.get("dari") ?? "", sampai: e.target.value, area })} />
        </>
      )}
      <select className="input w-auto" value={area} onChange={(e) => go({ bulan: sp.get("bulan") ?? "", tahun: sp.get("tahun") ?? "", dari: sp.get("dari") ?? "", sampai: sp.get("sampai") ?? "", area: e.target.value })}>
        <option value="">Seluruh area</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
    </div>
  );
}
