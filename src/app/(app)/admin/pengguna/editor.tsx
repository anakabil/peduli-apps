"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateUserAction, createUserAction, adjustPointsAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { ROLES, ROLE_LABEL, USER_STATUS, USER_STATUS_LABEL } from "@/lib/constants";
import { Field } from "@/components/ui";

type Area = { id: string; name: string };
type Sup = { id: string; name: string; role: string };

function Fields({ u, areas, supervisors }: { u?: { name: string; role: string; status: string; nik: string | null; jabatan: string | null; departemen: string | null; areaId: string | null; atasanId: string | null }; areas: Area[]; supervisors: Sup[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Nama" required><input name="name" className="input" defaultValue={u?.name ?? ""} required /></Field>
      <Field label="NIK"><input name="nik" className="input" defaultValue={u?.nik ?? ""} /></Field>
      <Field label="Peran" required>
        <select name="role" className="input" defaultValue={u?.role ?? "PENGAWAS"}>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      </Field>
      {u && (
        <Field label="Status">
          <select name="status" className="input" defaultValue={u.status}>
            {USER_STATUS.map((s) => <option key={s} value={s}>{USER_STATUS_LABEL[s]}</option>)}
          </select>
        </Field>
      )}
      <Field label="Jabatan"><input name="jabatan" className="input" defaultValue={u?.jabatan ?? ""} /></Field>
      <Field label="Departemen"><input name="departemen" className="input" defaultValue={u?.departemen ?? ""} /></Field>
      <Field label="Area kerja">
        <select name="areaId" className="input" defaultValue={u?.areaId ?? ""}>
          <option value="">-</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label="Atasan langsung" help="Superintendent bagi Pengawas, Manager bagi Superintendent.">
        <select name="atasanId" className="input" defaultValue={u?.atasanId ?? ""}>
          <option value="">-</option>
          {supervisors.map((s) => <option key={s.id} value={s.id}>{s.name} ({ROLE_LABEL[s.role as keyof typeof ROLE_LABEL]})</option>)}
        </select>
      </Field>
    </div>
  );
}

export function UserEditor({ user, areas, supervisors }: { user: { id: string; name: string; role: string; status: string; nik: string | null; jabatan: string | null; departemen: string | null; areaId: string | null; atasanId: string | null }; areas: Area[]; supervisors: Sup[] }) {
  const [open, setOpen] = useState(false);
  const { pending, res, action } = useFormAction((fd) => updateUserAction(user.id, fd));
  const adj = useFormAction(async (fd) => adjustPointsAction(user.id, Number(fd.get("points")), String(fd.get("note") ?? "")));
  if (!open) return <button className="btn-ghost btn-sm" onClick={() => setOpen(true)}><Pencil size={14} /> Ubah</button>;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-0 sm:items-center sm:p-4 anim-fade-in" onClick={() => setOpen(false)}>
      <div className="card w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-b-none sm:rounded-b-2xl p-5 anim-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Ubah pengguna</h3>
          <button className="rounded-full p-1.5 hover:bg-ink-100" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <form action={action} className="mt-4 space-y-4">
          <Fields u={user} areas={areas} supervisors={supervisors} />
          <div className="flex items-center justify-between gap-3">
            <Msg res={res} />
            <button disabled={pending} className="btn-primary ml-auto">{pending ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
        <form action={adj.action} className="mt-5 border-t border-ink-100 pt-4">
          <div className="text-sm font-bold">Penyesuaian poin manual</div>
          <div className="mt-2 grid grid-cols-[110px_1fr_auto] gap-2">
            <input name="points" type="number" className="input" placeholder="+5 / -5" required />
            <input name="note" className="input" placeholder="Alasan (wajib, tercatat di audit)" required />
            <button disabled={adj.pending} className="btn-secondary">Terapkan</button>
          </div>
          <div className="mt-1"><Msg res={adj.res} /></div>
        </form>
      </div>
    </div>
  );
}

export function NewUserForm({ areas, supervisors }: { areas: Area[]; supervisors: Sup[] }) {
  const { pending, res, action } = useFormAction(createUserAction);
  return (
    <form action={action} className="space-y-3">
      <h3 className="font-bold">Tambah pengguna</h3>
      <Field label="Email Google" required help="Pengguna akan masuk dengan akun Google ini."><input name="email" type="email" className="input" required /></Field>
      <Fields areas={areas} supervisors={supervisors} />
      <div className="flex items-center justify-between gap-3">
        <Msg res={res} />
        <button disabled={pending} className="btn-primary ml-auto">{pending ? "Menyimpan..." : "Buat akun aktif"}</button>
      </div>
    </form>
  );
}
