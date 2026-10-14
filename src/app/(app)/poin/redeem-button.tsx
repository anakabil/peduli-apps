"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redeemAction } from "./actions";

export function RedeemButton({ rewardId, disabled }: { rewardId: string; disabled: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  if (msg) return <p className="text-xs text-brand-700">{msg}</p>;
  if (confirm)
    return (
      <div className="flex gap-1.5">
        <button className="btn-secondary btn-sm flex-1" onClick={() => setConfirm(false)}>Batal</button>
        <button
          className="btn-primary btn-sm flex-1"
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
          {pending ? "..." : "Ya, tukar"}
        </button>
      </div>
    );
  return (
    <button className="btn-primary btn-sm w-full" disabled={disabled} onClick={() => setConfirm(true)}>
      Tukar poin
    </button>
  );
}
