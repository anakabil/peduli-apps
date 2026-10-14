"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { processRedemptionAction } from "../actions";

export function ProcessButtons({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const router = useRouter();
  const go = (s: "DIPROSES" | "SELESAI" | "DITOLAK") =>
    start(async () => {
      await processRedemptionAction(id, s, note);
      router.refresh();
    });
  return (
    <div className="flex flex-col gap-1.5 min-w-44">
      <input className="input py-1.5 text-xs" placeholder="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-1">
        {status === "DIAJUKAN" && <button disabled={pending} className="btn-secondary btn-sm" onClick={() => go("DIPROSES")}>Proses</button>}
        <button disabled={pending} className="btn-success btn-sm" onClick={() => go("SELESAI")}>Selesai</button>
        <button disabled={pending} className="btn-danger btn-sm" onClick={() => go("DITOLAK")}>Tolak</button>
      </div>
    </div>
  );
}
