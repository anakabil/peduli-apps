"use client";

import { useEffect, useState } from "react";
import { CloudUpload } from "lucide-react";
import { flushQueue, listQueue } from "@/lib/client/offline-queue";
import { useRouter } from "next/navigation";

let inFlight = false;

/** Mengirim antrean laporan luring saat sinyal kembali */
export function OfflineSync() {
  const [pending, setPending] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const q = await listQueue();
        if (!active) return;
        setPending(q.length);
        if (q.length && navigator.onLine) {
          const sent = await flushQueue((r) => setToast(`Laporan ${r.number} terkirim dari antrean luring.`));
          if (sent) {
            const left = await listQueue();
            setPending(left.length);
            router.refresh();
          }
        }
      } finally {
        inFlight = false;
      }
    };
    run();
    window.addEventListener("online", run);
    const t = setInterval(run, 60000);
    return () => {
      active = false;
      window.removeEventListener("online", run);
      clearInterval(t);
    };
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!pending && !toast) return null;
  return (
    <div className="no-print fixed bottom-24 left-1/2 z-50 -translate-x-1/2 md:bottom-6 anim-fade-up">
      <div className="flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white shadow-float">
        <CloudUpload size={14} className="text-brand-300" />
        {toast ?? `${pending} laporan menunggu sinyal untuk dikirim`}
      </div>
    </div>
  );
}
