"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type Res = { ok: boolean; message: string };

export function useFormAction(fn: (fd: FormData) => Promise<Res>) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<Res | null>(null);
  const router = useRouter();
  const action = (fd: FormData) =>
    start(async () => {
      const r = await fn(fd);
      setRes(r);
      if (r.ok) router.refresh();
    });
  return { pending, res, action };
}

export function Msg({ res }: { res: Res | null }) {
  if (!res) return null;
  return <p className={`text-sm anim-fade-in ${res.ok ? "text-brand-700" : "text-red"}`}>{res.message}</p>;
}
