"use client";

import { saveAreaAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { Field } from "@/components/ui";

export function AreaForm({ area, managers }: { area?: { id: string; code: string; name: string; lat: number | null; lng: number | null; radiusM: number; managerId: string | null; active: boolean }; managers: Array<{ id: string; name: string }> }) {
  const { pending, res, action } = useFormAction((fd) => saveAreaAction(area?.id ?? null, fd));
  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Kode" required><input name="code" className="input" defaultValue={area?.code ?? ""} maxLength={8} required /></Field>
      <Field label="Nama" required><input name="name" className="input" defaultValue={area?.name ?? ""} required /></Field>
      <Field label="Latitude"><input name="lat" type="number" step="any" className="input" defaultValue={area?.lat ?? ""} placeholder="-5.9955" /></Field>
      <Field label="Longitude"><input name="lng" type="number" step="any" className="input" defaultValue={area?.lng ?? ""} placeholder="106.0152" /></Field>
      <Field label="Radius (m)"><input name="radiusM" type="number" className="input" defaultValue={area?.radiusM ?? 300} min={20} max={5000} /></Field>
      <Field label="Manager area">
        <select name="managerId" className="input" defaultValue={area?.managerId ?? ""}>
          <option value="">-</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>
      {area && (
        <Field label="Status">
          <select name="active" className="input" defaultValue={area.active ? "true" : "false"}>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </Field>
      )}
      <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <Msg res={res} />
        <button disabled={pending} className="btn-primary min-h-11 sm:ml-auto md:min-h-0">{pending ? "Menyimpan..." : area ? "Simpan perubahan" : "Tambah area"}</button>
      </div>
    </form>
  );
}
