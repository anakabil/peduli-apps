"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Cetak / simpan PDF" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn-secondary btn-sm">
      <Printer size={14} /> {label}
    </button>
  );
}
