"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { processRedemptionAction } from "../actions";
import { useTr } from "@/components/i18n/lang-provider";

export function ProcessButtons({ id, status }: { id: string; status: string }) {
  const tr = useTr();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const router = useRouter();
  const go = (s: "DIPROSES" | "SELESAI" | "DITOLAK") =>
    start(async () => {
      await processRedemptionAction(id, s, note);
      router.refresh();
    });
  return (
    <div className="flex flex-col gap-2 md:min-w-52 md:gap-1.5">
      <input className="input md:py-1.5 md:text-xs" placeholder={tr("Catatan", "Note")} aria-label={tr("Catatan penukaran", "Redemption note")} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2 md:gap-1.5 [&>button]:min-h-11 [&>button]:flex-1 md:[&>button]:min-h-0 md:[&>button]:flex-none">
        {status === "DIAJUKAN" && <button disabled={pending} className="btn-secondary btn-sm" onClick={() => go("DIPROSES")}>{tr("Proses", "Process")}</button>}
        <button disabled={pending} className="btn-success btn-sm" onClick={() => go("SELESAI")}>{tr("Selesai", "Complete")}</button>
        <button disabled={pending} className="btn-danger btn-sm" onClick={() => go("DITOLAK")}>{tr("Tolak", "Reject")}</button>
      </div>
    </div>
  );
}
