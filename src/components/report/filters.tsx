"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useTransition } from "react";
import { STATUSES, STATUS_LABEL, CATEGORIES, CATEGORY_LABEL, RISKS, RISK_LABEL } from "@/lib/constants";
import { cn } from "@/lib/format";

const PANEL_KEYS = ["status", "category", "risk", "area"];

export function ReportFilters({ areas }: { areas: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const panelActive = PANEL_KEYS.filter((k) => sp.get(k)).length;
  const [open, setOpen] = useState(panelActive > 0);
  const spQ = sp.get("q") ?? "";
  const [q, setQ] = useState(spQ);
  const [prevQ, setPrevQ] = useState(spQ);
  const [, start] = useTransition();

  // Selaraskan kotak cari bila URL berubah dari luar (mis. tautan "Hapus filter")
  if (spQ !== prevQ) {
    setPrevQ(spQ);
    setQ(spQ);
  }

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    p.delete("page");
    start(() => router.replace(`${pathname}?${p.toString()}`));
  };
  const active = panelActive + (spQ ? 1 : 0);

  return (
    <div className="no-print mb-4 space-y-2 anim-fade-in">
      <div className="flex gap-2">
        <form
          role="search"
          className="relative flex min-w-0 flex-1 items-center"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q);
          }}
        >
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            className="input block min-h-11 pl-10 md:min-h-0"
            placeholder="Cari nomor, uraian, lokasi..."
            aria-label="Cari laporan"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn("btn-secondary min-h-11 shrink-0 md:min-h-0", (panelActive > 0 || open) && "border-brand-600 bg-brand-50 text-brand-800 hover:border-brand-600")}
        >
          <SlidersHorizontal size={16} /> Filter
          {panelActive > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1.5 text-xs font-semibold tabular-nums text-white" aria-label={`${panelActive} filter aktif`}>
              {panelActive}
            </span>
          )}
        </button>
      </div>
      {open && (
        <div className="card grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 md:grid-cols-4 anim-fade-up">
          <select className={cn("input min-h-11 md:min-h-0", sp.get("status") && "border-brand-400")} aria-label="Status" value={sp.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)}>
            <option value="">Semua status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select className={cn("input min-h-11 md:min-h-0", sp.get("category") && "border-brand-400")} aria-label="Kategori" value={sp.get("category") ?? ""} onChange={(e) => setParam("category", e.target.value)}>
            <option value="">Semua kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
          <select className={cn("input min-h-11 md:min-h-0", sp.get("risk") && "border-brand-400")} aria-label="Risiko" value={sp.get("risk") ?? ""} onChange={(e) => setParam("risk", e.target.value)}>
            <option value="">Semua risiko</option>
            {RISKS.map((r) => (
              <option key={r} value={r}>{RISK_LABEL[r]}</option>
            ))}
          </select>
          <select className={cn("input min-h-11 md:min-h-0", sp.get("area") && "border-brand-400")} aria-label="Area" value={sp.get("area") ?? ""} onChange={(e) => setParam("area", e.target.value)}>
            <option value="">Semua area</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {active > 0 && (
            <button type="button" className="btn-ghost btn-sm col-span-full min-h-11 justify-self-end md:min-h-0" onClick={() => start(() => router.replace(pathname))}>
              <X size={14} /> Hapus filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
