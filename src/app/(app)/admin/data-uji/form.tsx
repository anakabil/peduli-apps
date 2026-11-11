"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { resetDataAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { CardHeader } from "@/components/ui";
import type { previewReset } from "@/lib/reset";

type Preview = Awaited<ReturnType<typeof previewReset>>;
const num = (n: number) => n.toLocaleString("id-ID");

function Check({ name, value, defaultChecked, disabled, onChange, title, desc }: { name: string; value?: string; defaultChecked?: boolean; disabled?: boolean; onChange?: (v: boolean) => void; title: string; desc?: string }) {
  return (
    <label className={`flex min-h-12 cursor-pointer items-start gap-3 px-5 py-3 ${disabled ? "opacity-50" : ""}`}>
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--brand-600)]" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-800">{title}</span>
        {desc && <span className="block text-xs text-ink-500">{desc}</span>}
      </span>
    </label>
  );
}

export function ResetForm({ preview: p, disabled }: { preview: Preview; disabled: boolean }) {
  const { pending, res, action } = useFormAction(resetDataAction);
  const [tx, setTx] = useState(true);
  const [confirm, setConfirm] = useState("");
  return (
    <form action={action} className="space-y-4">
      <div className="card overflow-hidden anim-fade-up">
        <CardHeader title="Data transaksi" subtitle="Seluruh laporan beserta foto dan riwayatnya, poin, penukaran, notifikasi, dan konsultasi." />
        <div className="mt-3 divide-y divide-ink-100 border-t border-ink-100">
          <Check name="transactions" defaultChecked onChange={setTx} title="Hapus seluruh data transaksi" desc={`${num(p.reports)} laporan, ${num(p.photos)} foto, ${num(p.ledger)} catatan poin, ${num(p.redemptions)} penukaran, ${num(p.notifications)} notifikasi, ${num(p.consultations)} konsultasi. Nomor laporan dimulai lagi dari 0001.`} />
        </div>
      </div>

      <div className="card overflow-hidden anim-fade-up">
        <CardHeader title="Data contoh" subtitle="Hanya dapat dihapus bersama data transaksi." />
        <div className="mt-3 divide-y divide-ink-100 border-t border-ink-100">
          <Check name="demoUsers" defaultChecked disabled={!tx || !p.demoUsers.length} title={`Akun demo (${p.demoUsers.length})`} desc={p.demoUsers.length ? p.demoUsers.map((u) => u.name).join(", ") : "Tidak ada."} />
          {p.rewards.map((r) => (
            <Check key={r.id} name="rewardIds" value={r.id} defaultChecked disabled={!tx} title={`Reward contoh: ${r.name}`} />
          ))}
          {p.areas.map((a) => (
            <Check
              key={a.id}
              name="areaIds"
              value={a.id}
              defaultChecked={a.suggested}
              title={`Area contoh: ${a.code} ${a.name}`}
              desc={a.realUsers ? `Dipakai ${a.realUsers} akun nyata; akun tersebut akan kehilangan area.` : a.suggested ? "Belum disesuaikan." : "Sudah disesuaikan, periksa sebelum menghapus."}
            />
          ))}
        </div>
      </div>

      <div className="card overflow-hidden anim-fade-up">
        <CardHeader title="Jejak audit" subtitle="Biasanya dipertahankan sebagai bukti tata kelola." />
        <div className="mt-3 border-t border-ink-100">
          <Check name="audit" title={`Hapus jejak audit (${num(p.auditLogs)})`} desc="Catatan pembersihan ini tetap dibuat." />
        </div>
      </div>

      <div className="card p-5 anim-fade-up">
        <label className="label" htmlFor="confirm">Ketik HAPUS DATA UJI untuk konfirmasi</label>
        <input id="confirm" name="confirm" className="input" autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Msg res={res} />
          <button disabled={pending || disabled || confirm.trim().toUpperCase() !== "HAPUS DATA UJI"} className="btn-danger min-h-11 sm:ml-auto md:min-h-0">
            <Trash2 size={16} /> {pending ? "Menghapus..." : "Hapus data"}
          </button>
        </div>
      </div>
    </form>
  );
}
