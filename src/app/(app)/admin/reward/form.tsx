"use client";

import { saveRewardAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { Field } from "@/components/ui";

// Nilai tersimpan tetap nama ikon lucide, label ditampilkan dalam bahasa Indonesia
const ICONS = [
  { value: "Package", label: "Paket hadiah" },
  { value: "Umbrella", label: "Payung" },
  { value: "CupSoda", label: "Minuman" },
  { value: "Footprints", label: "Sepatu" },
  { value: "Ticket", label: "Voucer" },
];

export function RewardForm({ reward }: { reward?: { id: string; name: string; description: string | null; pointsCost: number; stock: number; tier: string; icon: string | null; active: boolean } }) {
  const { pending, res, action } = useFormAction((fd) => saveRewardAction(reward?.id ?? null, fd));
  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Nama" required><input name="name" className="input" defaultValue={reward?.name ?? ""} required /></Field>
      <Field label="Nilai poin" required><input name="pointsCost" type="number" min={1} className="input" defaultValue={reward?.pointsCost ?? 10} required /></Field>
      <div className="sm:col-span-2"><Field label="Deskripsi"><input name="description" className="input" defaultValue={reward?.description ?? ""} /></Field></div>
      <Field label="Stok"><input name="stock" type="number" min={0} className="input" defaultValue={reward?.stock ?? 0} /></Field>
      {reward && <input type="hidden" name="stockOriginal" value={reward.stock} />}
      <Field label="Tingkat">
        <select name="tier" className="input" defaultValue={reward?.tier ?? "AWAL"}>
          <option value="AWAL">Awal</option><option value="MENENGAH">Menengah</option><option value="LANJUT">Lanjut</option>
        </select>
      </Field>
      <Field label="Ikon">
        <select name="icon" className="input" defaultValue={reward?.icon ?? "Package"}>
          {ICONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
        </select>
      </Field>
      {reward && (
        <Field label="Status">
          <select name="active" className="input" defaultValue={reward.active ? "true" : "false"}><option value="true">Aktif</option><option value="false">Nonaktif</option></select>
        </Field>
      )}
      <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <Msg res={res} />
        <button disabled={pending} className="btn-primary min-h-11 sm:ml-auto md:min-h-0">{pending ? "Menyimpan..." : reward ? "Simpan" : "Tambah"}</button>
      </div>
    </form>
  );
}
