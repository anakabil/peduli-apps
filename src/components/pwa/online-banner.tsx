"use client";

import { WifiOff } from "lucide-react";
import { usePwa } from "./pwa-provider";

export function OnlineBanner() {
  const { online } = usePwa();
  if (online) return null;
  return (
    <div className="no-print flex items-center justify-center gap-2 bg-amber/90 px-3 py-1.5 text-xs font-semibold text-ink-900 anim-fade-in">
      <WifiOff size={14} /> Luring. Laporan akan disimpan di perangkat dan dikirim otomatis saat sinyal kembali.
    </div>
  );
}
