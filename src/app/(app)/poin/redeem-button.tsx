"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redeemAction } from "./actions";

// reason: alasan singkat saat tombol nonaktif, ditampilkan sebagai label tombol
export function RedeemButton({ rewardId, disabled, reason }: { rewardId: string; disabled: boolean; reason?: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  if (msg) return <p className="text-xs leading-snug text-brand-700" role="status">{msg}</p>;
  if (confirm)
    return (
      <div className="flex gap-1.5">
        <button className="btn-secondary btn-sm min-h-11 flex-1 sm:min-h-9" onClick={() => setConfirm(false)}>Batal</button>
        <button
          className="btn-primary btn-sm min-h-11 flex-1 sm:min-h-9"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await redeemAction(rewardId);
              setMsg(r.message);
              setConfirm(false);
              router.refresh();
            })
          }
        >
          {pending ? "Memproses..." : "Ya, tukar"}
        </button>
      </div>
    );
  if (disabled)
    return (
      <button className="btn btn-sm min-h-11 w-full border border-ink-200 bg-ink-50 text-ink-500 tabular-nums disabled:opacity-100 sm:min-h-9" disabled>
        {reason ?? "Tukar poin"}
      </button>
    );
  return (
    <button className="btn-primary btn-sm min-h-11 w-full sm:min-h-9" onClick={() => setConfirm(true)}>
      Tukar poin
    </button>
  );
}
