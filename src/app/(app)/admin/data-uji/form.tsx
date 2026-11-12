"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { resetDataAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { CardHeader } from "@/components/ui";
import type { previewReset } from "@/lib/reset";
import { useLang, useTr } from "@/components/i18n/lang-provider";

type Preview = Awaited<ReturnType<typeof previewReset>>;

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
  const tr = useTr();
  const lang = useLang();
  const num = (n: number) => n.toLocaleString(lang === "en" ? "en-US" : "id-ID");
  const { pending, res, action } = useFormAction(resetDataAction);
  const [tx, setTx] = useState(true);
  const [confirm, setConfirm] = useState("");
  return (
    <form action={action} className="space-y-4">
      <div className="card overflow-hidden anim-fade-up">
        <CardHeader
          title={tr("Data transaksi", "Transaction data")}
          subtitle={tr("Seluruh laporan beserta foto dan riwayatnya, poin, penukaran, notifikasi, dan konsultasi.", "All hazard reports with their photos and history, points, redemptions, notifications, and consultations.")}
        />
        <div className="mt-3 divide-y divide-ink-100 border-t border-ink-100">
          <Check
            name="transactions"
            defaultChecked
            onChange={setTx}
            title={tr("Hapus seluruh data transaksi", "Delete all transaction data")}
            desc={tr(
              `${num(p.reports)} laporan, ${num(p.photos)} foto, ${num(p.ledger)} catatan poin, ${num(p.redemptions)} penukaran, ${num(p.notifications)} notifikasi, ${num(p.consultations)} konsultasi. Nomor laporan dimulai lagi dari 0001.`,
              `${num(p.reports)} hazard reports, ${num(p.photos)} photos, ${num(p.ledger)} point records, ${num(p.redemptions)} redemptions, ${num(p.notifications)} notifications, ${num(p.consultations)} consultations. Report numbering restarts from 0001.`,
            )}
          />
        </div>
      </div>

      <div className="card overflow-hidden anim-fade-up">
        <CardHeader title={tr("Data contoh", "Sample data")} subtitle={tr("Hanya dapat dihapus bersama data transaksi.", "Can only be deleted together with transaction data.")} />
        <div className="mt-3 divide-y divide-ink-100 border-t border-ink-100">
          <Check name="demoUsers" defaultChecked disabled={!tx || !p.demoUsers.length} title={tr(`Akun demo (${p.demoUsers.length})`, `Demo accounts (${p.demoUsers.length})`)} desc={p.demoUsers.length ? p.demoUsers.map((u) => u.name).join(", ") : tr("Tidak ada.", "None.")} />
          {p.rewards.map((r) => (
            <Check key={r.id} name="rewardIds" value={r.id} defaultChecked disabled={!tx} title={tr(`Reward contoh: ${r.name}`, `Sample reward: ${r.name}`)} />
          ))}
          {p.areas.map((a) => (
            <Check
              key={a.id}
              name="areaIds"
              value={a.id}
              defaultChecked={a.suggested}
              title={tr(`Area contoh: ${a.code} ${a.name}`, `Sample area: ${a.code} ${a.name}`)}
              desc={
                a.realUsers
                  ? tr(`Dipakai ${a.realUsers} akun nyata; akun tersebut akan kehilangan area.`, `Used by ${a.realUsers} real account${a.realUsers === 1 ? "" : "s"}; ${a.realUsers === 1 ? "that account" : "those accounts"} will lose ${a.realUsers === 1 ? "its" : "their"} area.`)
                  : a.suggested
                    ? tr("Belum disesuaikan.", "Not yet customised.")
                    : tr("Sudah disesuaikan, periksa sebelum menghapus.", "Already customised; check before deleting.")
              }
            />
          ))}
        </div>
      </div>

      <div className="card overflow-hidden anim-fade-up">
        <CardHeader title={tr("Jejak audit", "Audit trail")} subtitle={tr("Biasanya dipertahankan sebagai bukti tata kelola.", "Usually kept as governance evidence.")} />
        <div className="mt-3 border-t border-ink-100">
          <Check name="audit" title={tr(`Hapus jejak audit (${num(p.auditLogs)})`, `Delete audit trail (${num(p.auditLogs)})`)} desc={tr("Catatan pembersihan ini tetap dibuat.", "A record of this cleanup is still created.")} />
        </div>
      </div>

      <div className="card p-5 anim-fade-up">
        <label className="label" htmlFor="confirm">{tr("Ketik HAPUS DATA UJI untuk konfirmasi", "Type HAPUS DATA UJI to confirm")}</label>
        <input id="confirm" name="confirm" className="input" autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Msg res={res} />
          <button disabled={pending || disabled || confirm.trim().toUpperCase() !== "HAPUS DATA UJI"} className="btn-danger min-h-11 sm:ml-auto md:min-h-0">
            <Trash2 size={16} /> {pending ? tr("Menghapus...", "Deleting...") : tr("Hapus data", "Delete data")}
          </button>
        </div>
      </div>
    </form>
  );
}
