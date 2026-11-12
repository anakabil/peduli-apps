"use client";

import { WifiOff } from "lucide-react";
import { usePwa } from "./pwa-provider";
import { useTr } from "@/components/i18n/lang-provider";

export function OnlineBanner() {
  const { online } = usePwa();
  const tr = useTr();
  if (online) return null;
  return (
    <div className="no-print flex items-center justify-center gap-2 bg-amber/90 px-3 py-1.5 text-xs font-semibold text-ink-900 anim-fade-in">
      <WifiOff size={14} /> {tr("Luring. Laporan akan disimpan di perangkat dan dikirim otomatis saat sinyal kembali.", "Offline. Reports will be saved on this device and sent automatically when the connection returns.")}
    </div>
  );
}
