"use client";

import { Printer } from "lucide-react";
import { useTr } from "@/components/i18n/lang-provider";

export function PrintButton({ label }: { label?: string }) {
  const tr = useTr();
  return (
    <button onClick={() => window.print()} className="btn-secondary btn-sm">
      <Printer size={14} /> {label ?? tr("Cetak / simpan PDF", "Print / save as PDF")}
    </button>
  );
}
