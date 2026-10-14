"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, X } from "lucide-react";
import { usePwa } from "./pwa-provider";

const KEY = "peduli:install-dismissed";

/** Lembar bawah tawaran pemasangan ke layar utama (muncul otomatis di smartphone) */
export function InstallPrompt({ auto = true }: { auto?: boolean }) {
  const { canInstall, isStandalone, isIos, isMobile, promptInstall } = usePwa();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!auto || isStandalone || !isMobile) return;
    let dismissed = false;
    try {
      const ts = localStorage.getItem(KEY);
      dismissed = !!ts && Date.now() - Number(ts) < 3 * 86400000; // tawarkan lagi setelah 3 hari
    } catch {}
    if (dismissed) return;
    if (canInstall || isIos) {
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, [auto, canInstall, isIos, isMobile, isStandalone]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/40 anim-fade-in" onClick={close}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-safe shadow-float anim-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Pasang aplikasi"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink-200" />
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-brand-50 p-2 ring-1 ring-brand-100">
            <Image src="/icons/icon-192.png" alt="PEDULI" width={56} height={56} className="rounded-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-ink-900">Pasang PEDULI Apps</h3>
            <p className="mt-1 text-sm text-ink-500">
              Tambahkan ke layar utama agar pelaporan bahaya lebih cepat, lengkap dengan mode luring.
            </p>
          </div>
          <button onClick={close} className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {isIos && !canInstall ? (
          <div className="mt-4 rounded-2xl bg-ink-50 p-4 text-sm text-ink-700">
            <p className="font-semibold">Di iPhone atau iPad:</p>
            <ol className="mt-2 space-y-1.5 list-decimal pl-5">
              <li>
                Ketuk tombol <Share size={16} className="inline text-blue" /> Bagikan di Safari
              </li>
              <li>
                Pilih <span className="font-semibold">Tambah ke Layar Utama</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="mt-5 flex gap-3">
            <button onClick={close} className="btn-secondary flex-1">
              Nanti saja
            </button>
            <button
              onClick={async () => {
                const ok = await promptInstall();
                if (ok) setOpen(false);
                else close();
              }}
              className="btn-primary flex-1"
            >
              <Download size={16} /> Pasang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Tombol instal kecil untuk ditempatkan di menu, muncul hanya bila bisa dipasang */
export function InstallButton({ className = "" }: { className?: string }) {
  const { canInstall, isStandalone, promptInstall } = usePwa();
  if (!canInstall || isStandalone) return null;
  return (
    <button onClick={() => promptInstall()} className={`btn-secondary btn-sm ${className}`}>
      <Download size={14} /> Pasang aplikasi
    </button>
  );
}
