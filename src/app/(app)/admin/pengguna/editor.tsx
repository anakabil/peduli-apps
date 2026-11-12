"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateUserAction, createUserAction, adjustPointsAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { ROLES, USER_STATUS, labels, type Role } from "@/lib/constants";
import { Field } from "@/components/ui";
import { useLang, useTr } from "@/components/i18n/lang-provider";

type Area = { id: string; name: string };
type Sup = { id: string; name: string; role: string };

function Fields({ u, areas, supervisors }: { u?: { name: string; role: string; status: string; nik: string | null; jabatan: string | null; departemen: string | null; areaId: string | null; atasanId: string | null }; areas: Area[]; supervisors: Sup[] }) {
  const tr = useTr();
  const L = labels(useLang());
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={tr("Nama", "Name")} required><input name="name" className="input" defaultValue={u?.name ?? ""} required /></Field>
      <Field label={tr("NIK", "Employee ID (NIK)")}><input name="nik" className="input" defaultValue={u?.nik ?? ""} /></Field>
      <Field label={tr("Peran", "Role")} required>
        <select name="role" className="input" defaultValue={u?.role ?? "PENGAWAS"}>
          {ROLES.map((r) => <option key={r} value={r}>{L.ROLE_LABEL[r]}</option>)}
        </select>
      </Field>
      {u && (
        <Field label={tr("Status", "Status")}>
          <select name="status" className="input" defaultValue={u.status}>
            {USER_STATUS.map((s) => <option key={s} value={s}>{L.USER_STATUS_LABEL[s]}</option>)}
          </select>
        </Field>
      )}
      <Field label={tr("Jabatan", "Position")}><input name="jabatan" className="input" defaultValue={u?.jabatan ?? ""} /></Field>
      <Field label={tr("Departemen", "Department")}><input name="departemen" className="input" defaultValue={u?.departemen ?? ""} /></Field>
      <Field label={tr("Area kerja", "Work area")}>
        <select name="areaId" className="input" defaultValue={u?.areaId ?? ""}>
          <option value="">-</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label={tr("Atasan langsung", "Direct superior")} help={tr("Superintendent bagi Pengawas, Manager bagi Superintendent.", "A Superintendent for Supervisors, a Manager for Superintendents.")}>
        <select name="atasanId" className="input" defaultValue={u?.atasanId ?? ""}>
          <option value="">-</option>
          {supervisors.map((s) => <option key={s.id} value={s.id}>{s.name} ({L.ROLE_LABEL[s.role as Role]})</option>)}
        </select>
      </Field>
    </div>
  );
}

export function UserEditor({ user, areas, supervisors }: { user: { id: string; name: string; role: string; status: string; nik: string | null; jabatan: string | null; departemen: string | null; areaId: string | null; atasanId: string | null }; areas: Area[]; supervisors: Sup[] }) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const { pending, res, action } = useFormAction((fd) => updateUserAction(user.id, fd));
  const adj = useFormAction(async (fd) => adjustPointsAction(user.id, Number(fd.get("points")), String(fd.get("note") ?? "")));
  if (!open) return <button className="btn-secondary btn-sm min-h-9" onClick={() => setOpen(true)}><Pencil size={14} /> {tr("Ubah", "Edit")}</button>;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-0 sm:items-center sm:p-4 anim-fade-in" onClick={() => setOpen(false)}>
      <div className="card w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-b-none sm:rounded-b-2xl p-5 anim-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{tr("Ubah pengguna", "Edit user")} <span className="font-medium text-ink-500">{user.name}</span></h3>
          <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink-100" aria-label={tr("Tutup", "Close")} onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <form action={action} className="mt-4 space-y-4">
          <Fields u={user} areas={areas} supervisors={supervisors} />
          <div className="flex items-center justify-between gap-3">
            <Msg res={res} />
            <button disabled={pending} className="btn-primary ml-auto">{pending ? tr("Menyimpan...", "Saving...") : tr("Simpan", "Save")}</button>
          </div>
        </form>
        <form action={adj.action} className="mt-5 border-t border-ink-100 pt-4">
          <div className="text-sm font-bold">{tr("Penyesuaian poin manual", "Manual points adjustment")}</div>
          <div className="mt-2 grid grid-cols-[110px_1fr_auto] gap-2">
            <input name="points" type="number" className="input" placeholder="+5 / -5" aria-label={tr("Poin", "Points")} required />
            <input name="note" className="input" placeholder={tr("Alasan (wajib, tercatat di audit)", "Reason (required, recorded in the audit trail)")} aria-label={tr("Alasan", "Reason")} required />
            <button disabled={adj.pending} className="btn-secondary">{tr("Terapkan", "Apply")}</button>
          </div>
          <div className="mt-1"><Msg res={adj.res} /></div>
        </form>
      </div>
    </div>
  );
}

export function NewUserForm({ areas, supervisors }: { areas: Area[]; supervisors: Sup[] }) {
  const tr = useTr();
  const { pending, res, action } = useFormAction(createUserAction);
  return (
    <form action={action} className="space-y-3">
      <h3 className="font-bold">{tr("Tambah pengguna", "Add user")}</h3>
      <Field label={tr("Email Google", "Google email")} required help={tr("Pengguna akan masuk dengan akun Google ini.", "The user will sign in with this Google account.")}><input name="email" type="email" className="input" required /></Field>
      <Fields areas={areas} supervisors={supervisors} />
      <div className="flex items-center justify-between gap-3">
        <Msg res={res} />
        <button disabled={pending} className="btn-primary ml-auto">{pending ? tr("Menyimpan...", "Saving...") : tr("Buat akun aktif", "Create active account")}</button>
      </div>
    </form>
  );
}
