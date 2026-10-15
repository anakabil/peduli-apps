"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays } from "lucide-react";

export function PeriodPicker({ areas, mode }: { areas: Array<{ id: string; name: string }>; mode: "bulan" | "tahun" | "rentang" }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();
  // Tanggal hari ini menurut WIB (bukan UTC), agar rentang tidak terpotong satu hari pada pagi hari
  const wib = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const now = { year: Number(wib.slice(0, 4)), month: Number(wib.slice(5, 7)), today: wib };
  const curMonth = wib.slice(0, 7);

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
          <button key={m} onClick={() => go(m === "bulan" ? { bulan: curMonth, area } : m === "tahun" ? { tahun: String(now.year), area } : { dari: `${now.year}-01-01`, sampai: now.today, area })} className={`rounded-md px-3 py-1.5 capitalize transition-colors ${mode === m ? "bg-brand-700 text-white" : "text-ink-600 hover:bg-ink-100"}`}>
            {m}
          </button>
        ))}
      </div>
      {mode === "bulan" && <input type="month" className="input w-auto" value={sp.get("bulan") ?? curMonth} max={curMonth} onChange={(e) => go({ bulan: e.target.value, area })} />}
      {mode === "tahun" && (
        <select className="input w-auto" value={sp.get("tahun") ?? String(now.year)} onChange={(e) => go({ tahun: e.target.value, area })}>
          {[0, 1, 2, 3].map((i) => (
            <option key={i} value={now.year - i}>{now.year - i}</option>
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
