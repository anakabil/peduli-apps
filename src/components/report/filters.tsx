"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useTransition } from "react";
import { STATUSES, STATUS_LABEL, CATEGORIES, CATEGORY_LABEL, RISKS, RISK_LABEL } from "@/lib/constants";

export function ReportFilters({ areas }: { areas: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [, start] = useTransition();

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    p.delete("page");
    start(() => router.replace(`${pathname}?${p.toString()}`));
  };
  const active = ["status", "category", "risk", "area", "q"].filter((k) => sp.get(k)).length;

  return (
    <div className="no-print mb-4 space-y-2 anim-fade-in">
      <div className="flex gap-2">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q);
          }}
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder="Cari nomor, uraian, lokasi..." value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <button type="button" onClick={() => setOpen((o) => !o)} className={`btn-secondary ${active ? "border-brand-400 text-brand-700" : ""}`}>
          <SlidersHorizontal size={16} /> Filter {active ? `(${active})` : ""}
        </button>
      </div>
      {open && (
        <div className="card grid grid-cols-2 gap-2 p-3 md:grid-cols-4 anim-fade-up">
          <select className="input" value={sp.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)}>
            <option value="">Semua status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select className="input" value={sp.get("category") ?? ""} onChange={(e) => setParam("category", e.target.value)}>
            <option value="">Semua kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
          <select className="input" value={sp.get("risk") ?? ""} onChange={(e) => setParam("risk", e.target.value)}>
            <option value="">Semua risiko</option>
            {RISKS.map((r) => (
              <option key={r} value={r}>{RISK_LABEL[r]}</option>
            ))}
          </select>
          <select className="input" value={sp.get("area") ?? ""} onChange={(e) => setParam("area", e.target.value)}>
            <option value="">Semua area</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {active > 0 && (
            <button type="button" className="btn-ghost btn-sm col-span-2 md:col-span-4 justify-self-end" onClick={() => start(() => router.replace(pathname))}>
              <X size={14} /> Hapus filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
