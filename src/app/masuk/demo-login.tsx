"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ChevronDown, FlaskConical } from "lucide-react";

const ACCOUNTS = [
  { email: "admin@demo.peduli.local", label: "Admin", desc: "Pengelola program" },
  { email: "direksi@demo.peduli.local", label: "Direksi", desc: "Hendra Wijaya" },
  { email: "manager@demo.peduli.local", label: "Manager", desc: "Budi Santoso, Produksi" },
  { email: "manager2@demo.peduli.local", label: "Manager", desc: "Sri Lestari, Gudang" },
  { email: "superintendent@demo.peduli.local", label: "Superintendent", desc: "Agus Prasetyo" },
  { email: "superintendent2@demo.peduli.local", label: "Superintendent", desc: "Dewi Anggraini" },
  { email: "pengawas@demo.peduli.local", label: "Pengawas", desc: "Rizky Firmansyah" },
  { email: "pengawas2@demo.peduli.local", label: "Pengawas", desc: "Yuni Astuti" },
];

export function DemoLogin() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/60">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-brand-700">
        <span className="flex items-center gap-2">
          <FlaskConical size={16} /> Mode demo: masuk sebagai akun contoh
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-2 px-3 pb-3 anim-fade-in">
          {ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              disabled={!!busy}
              onClick={async () => {
                setBusy(a.email);
                await signIn("demo", { email: a.email, callbackUrl: "/beranda" });
              }}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-left transition-all hover:border-brand-400 hover:shadow-card disabled:opacity-60"
            >
              <div className="text-xs font-bold text-ink-800">{a.label}</div>
              <div className="text-[11px] text-ink-500">{busy === a.email ? "Masuk..." : a.desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
