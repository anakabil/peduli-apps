"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, FlaskConical } from "lucide-react";
import { deleteUserAction, deleteDummyUsersAction } from "../actions";
import { useTr } from "@/components/i18n/lang-provider";

type Res = { ok: boolean; message: string };

function Confirm({ title, body, confirmLabel, onConfirm, onClose }: { title: string; body: React.ReactNode; confirmLabel: string; onConfirm: () => Promise<Res>; onClose: () => void }) {
  const tr = useTr();
  const [pending, start] = useTransition();
  const [res, setRes] = useState<Res | null>(null);
  const router = useRouter();
  // Daftar dimuat ulang setelah dialog ditutup agar pesan hasil tetap terbaca (baris yang dihapus ikut hilang)
  const close = () => {
    if (pending) return;
    onClose();
    if (res?.ok) router.refresh();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-0 sm:items-center sm:p-4 anim-fade-in" onClick={close}>
      <div role="alertdialog" aria-modal="true" aria-label={title} className="card w-full max-w-md rounded-b-none p-5 text-left sm:rounded-b-2xl anim-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red/10 text-red"><Trash2 size={17} /></span>
            <h3 className="text-base font-bold text-ink-900">{title}</h3>
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink-100" aria-label={tr("Tutup", "Close")} onClick={close}><X size={17} /></button>
        </div>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink-600">{body}</div>
        {res && <p className={`mt-3 text-sm ${res.ok ? "text-brand-700" : "text-red"}`}>{res.message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          {res?.ok ? (
            <button className="btn-primary" onClick={close}>{tr("Tutup", "Close")}</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={close} disabled={pending}>{tr("Batal", "Cancel")}</button>
              <button
                className="btn-primary bg-red! hover:bg-red/90!"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await onConfirm();
                    setRes(r);
                  })
                }
              >
                <Trash2 size={15} /> {pending ? tr("Menghapus...", "Deleting...") : confirmLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeleteUserButton({ id, name, dummy, reports }: { id: string; name: string; dummy: boolean; reports: number }) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-secondary btn-sm min-h-9 text-red hover:border-red/40" onClick={() => setOpen(true)} aria-label={tr(`Hapus ${name}`, `Delete ${name}`)}>
        <Trash2 size={14} /> {tr("Hapus", "Delete")}
      </button>
      {open && (
        <Confirm
          title={tr("Hapus pengguna", "Delete user")}
          confirmLabel={tr("Hapus akun", "Delete account")}
          onClose={() => setOpen(false)}
          onConfirm={() => deleteUserAction(id)}
          body={
            <>
              <p>
                {tr("Akun ", "The account ")}
                <b className="text-ink-900">{name}</b>
                {tr(" akan dihapus permanen dan tidak dapat dipulihkan.", " will be permanently deleted and cannot be recovered.")}
              </p>
              {dummy ? (
                <p>
                  {tr("Ini akun dummy. ", "This is a dummy account. ")}
                  {reports
                    ? tr(`${reports} laporan yang dibuatnya beserta foto, poin, dan riwayatnya ikut terhapus.`, `The ${reports} hazard report${reports === 1 ? "" : "s"} it created, with photos, points, and history, will also be deleted.`)
                    : tr("Seluruh data miliknya ikut terhapus.", "All of its data will also be deleted.")}
                </p>
              ) : (
                <p>
                  {tr(
                    "Akun yang sudah memiliki riwayat kerja (laporan, keputusan, poin) tidak akan dihapus demi jejak audit SMK3. Untuk akun seperti itu, ubah statusnya menjadi Nonaktif.",
                    "Accounts that already have a work history (reports, decisions, points) are not deleted, to preserve the OHS management system (SMK3) audit trail. For such accounts, change the status to Inactive.",
                  )}
                </p>
              )}
            </>
          }
        />
      )}
    </>
  );
}

export function DummyAccounts({ count, reports }: { count: number; reports: number }) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-dashed border-ink-300 bg-ink-50 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-2.5 text-sm text-ink-700">
        <FlaskConical size={17} className="mt-0.5 shrink-0 text-ink-500" />
        <div>
          <b>{tr(`${count} akun dummy`, `${count} dummy account${count === 1 ? "" : "s"}`)}</b>
          {tr(
            ` (akun contoh bawaan uji coba) masih terdaftar${reports ? `, dengan ${reports} laporan` : ""}. Hapus agar daftar pengguna dan statistik hanya berisi personel sebenarnya.`,
            ` (built-in sample accounts for the trial) ${count === 1 ? "is" : "are"} still registered${reports ? `, with ${reports} hazard report${reports === 1 ? "" : "s"}` : ""}. Delete them so the user list and statistics include only actual personnel.`,
          )}
        </div>
      </div>
      <button className="btn-secondary btn-sm min-h-9 shrink-0 text-red hover:border-red/40" onClick={() => setOpen(true)}>
        <Trash2 size={14} /> {tr("Hapus semua akun dummy", "Delete all dummy accounts")}
      </button>
      {open && (
        <Confirm
          title={tr("Hapus semua akun dummy", "Delete all dummy accounts")}
          confirmLabel={tr(`Hapus ${count} akun`, `Delete ${count} account${count === 1 ? "" : "s"}`)}
          onClose={() => setOpen(false)}
          onConfirm={() => deleteDummyUsersAction()}
          body={
            <>
              <p>
                {tr(
                  `Seluruh ${count} akun dummy dengan alamat surel berakhiran @demo.peduli.local akan dihapus permanen.`,
                  `All ${count} dummy account${count === 1 ? "" : "s"} with an email address ending in @demo.peduli.local will be permanently deleted.`,
                )}
              </p>
              <p>
                {reports
                  ? tr(`${reports} laporan yang dibuat akun dummy beserta foto, poin, dan riwayatnya ikut terhapus. `, `The ${reports} hazard report${reports === 1 ? "" : "s"} created by dummy accounts, with photos, points, and history, will also be deleted. `)
                  : ""}
                {tr("Akun Google personel sebenarnya tidak tersentuh.", "Google accounts of actual personnel are not affected.")}
              </p>
            </>
          }
        />
      )}
    </div>
  );
}
