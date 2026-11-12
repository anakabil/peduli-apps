"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { saveRewardAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { Field } from "@/components/ui";
import { REWARD_ICONS, rewardIconKey } from "@/lib/reward-icons";
import { compressImage } from "@/lib/client/image";
import { cn } from "@/lib/format";
import { useLang, useTr } from "@/components/i18n/lang-provider";

/** Label ikon dalam bahasa Inggris; label Indonesia ada di REWARD_ICONS */
const ICON_LABEL_EN: Record<string, string> = {
  gift: "Gift package", voucher: "Voucher", card: "Shopping card", money: "Balance or cash", shopping: "Shopping bag", grocery: "Groceries",
  meal: "Meal", coffee: "Coffee", snack: "Snacks", tumbler: "Tumbler", umbrella: "Umbrella", tshirt: "T-shirt", jacket: "Jacket", cap: "Cap",
  backpack: "Backpack", boots: "Safety boots", helmet: "Safety helmet", goggles: "Safety goggles", gloves: "Gloves", watch: "Wristwatch",
  headphone: "Headphones", powerbank: "Power bank", phone: "Phone credit or phone", fuel: "Fuel voucher", bicycle: "Bicycle", ball: "Sports",
  books: "Books", trophy: "Trophy", medal: "Medal", star: "Award",
};

type RewardData = { id: string; name: string; description: string | null; pointsCost: number; stock: number; tier: string; icon: string | null; active: boolean; imageAt: string | null };

export function RewardForm({ reward }: { reward?: RewardData }) {
  const tr = useTr();
  const lang = useLang();
  const iconLabel = (i: { key: string; label: string }) => (lang === "en" ? (ICON_LABEL_EN[i.key] ?? i.label) : i.label);
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [removed, setRemoved] = useState(false);
  const [icon, setIcon] = useState<string>(rewardIconKey(reward?.icon));
  const curIcon = REWARD_ICONS.find((i) => i.key === icon);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { pending, res, action } = useFormAction((fd) => {
    // Foto yang dikirim adalah hasil kompresi di peramban, bukan berkas asli
    fd.delete("photo");
    if (photo) fd.set("photo", photo.blob, "foto.webp");
    if (removed && !photo) fd.set("removePhoto", "1");
    return saveRewardAction(reward?.id ?? null, fd);
  });

  const existing = reward?.imageAt && !removed ? `/api/reward/${reward.id}/foto?v=${new Date(reward.imageAt).getTime()}` : null;
  const preview = photo?.url ?? existing;

  const onPick = async (file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPhotoError(tr("Pilih berkas gambar.", "Select an image file."));
    const { blob } = await compressImage(file, 1200, 0.85, "image/webp");
    if (blob.size > 4 * 1024 * 1024) return setPhotoError(tr("Ukuran foto maksimal 4 MB.", "The photo must not exceed 4 MB."));
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto({ blob, url: URL.createObjectURL(blob) });
    setRemoved(false);
  };
  const clearPhoto = () => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
    setRemoved(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={tr("Nama", "Name")} required><input name="name" className="input" defaultValue={reward?.name ?? ""} required /></Field>
      <Field label={tr("Nilai poin", "Point value")} required><input name="pointsCost" type="number" min={1} className="input" defaultValue={reward?.pointsCost ?? 10} required /></Field>
      <div className="sm:col-span-2"><Field label={tr("Deskripsi", "Description")}><input name="description" className="input" defaultValue={reward?.description ?? ""} /></Field></div>
      <Field label={tr("Stok", "Stock")}><input name="stock" type="number" min={0} className="input" defaultValue={reward?.stock ?? 0} /></Field>
      {reward && <input type="hidden" name="stockOriginal" value={reward.stock} />}
      <Field label={tr("Tingkat", "Tier")}>
        <select name="tier" className="input" defaultValue={reward?.tier ?? "AWAL"}>
          <option value="AWAL">{tr("Awal", "Entry")}</option><option value="MENENGAH">{tr("Menengah", "Intermediate")}</option><option value="LANJUT">{tr("Lanjut", "Advanced")}</option>
        </select>
      </Field>
      {reward && (
        <Field label={tr("Status", "Status")}>
          <select name="active" className="input" defaultValue={reward.active ? "true" : "false"}><option value="true">{tr("Aktif", "Active")}</option><option value="false">{tr("Nonaktif", "Inactive")}</option></select>
        </Field>
      )}

      <div className="sm:col-span-2">
        <div className="mb-1.5 text-[13px] font-medium text-ink-700">{tr("Foto hadiah", "Reward photo")}</div>
        <div className="flex items-center gap-3">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-50 ring-1 ring-inset ring-ink-100">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={tr("Pratinjau foto hadiah", "Reward photo preview")} className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/rewards/${icon}.webp`} alt="" aria-hidden className="size-14" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="btn-secondary btn-sm min-h-11 cursor-pointer md:min-h-0">
              <ImagePlus size={14} /> {preview ? tr("Ganti foto", "Change photo") : tr("Unggah foto", "Upload photo")}
              <input ref={fileRef} name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} />
            </label>
            {preview && (
              <button type="button" onClick={clearPhoto} className="btn-ghost btn-sm min-h-11 text-red md:min-h-0">
                <Trash2 size={14} /> {tr("Hapus foto", "Remove photo")}
              </button>
            )}
          </div>
        </div>
        {photoError && <p className="mt-1.5 text-xs text-red">{photoError}</p>}
        <p className="mt-1.5 text-xs text-ink-500">{tr("Tanpa foto, kartu hadiah memakai ikon di bawah.", "Without a photo, the reward card uses the icon below.")}</p>
      </div>

      <fieldset className="sm:col-span-2">
        <legend className="mb-1.5 text-[13px] font-medium text-ink-700">{tr("Ikon", "Icon")}</legend>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.6rem,1fr))] gap-1.5">
          {REWARD_ICONS.map((i) => (
            <label key={i.key} title={iconLabel(i)} className={cn("group relative flex aspect-square cursor-pointer items-center justify-center rounded-xl border bg-white transition-all hover:border-brand-300 hover:bg-brand-50/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-300", icon === i.key ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-ink-200")}>
              <input type="radio" name="icon" value={i.key} checked={icon === i.key} onChange={() => setIcon(i.key)} className="sr-only" aria-label={iconLabel(i)} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/rewards/${i.key}.webp`} alt="" aria-hidden loading="lazy" className="size-[70%] transition-transform group-hover:scale-110" />
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-ink-500">{curIcon && iconLabel(curIcon)}</p>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <Msg res={res} />
        <button disabled={pending} className="btn-primary min-h-11 sm:ml-auto md:min-h-0">{pending ? tr("Menyimpan...", "Saving...") : reward ? tr("Simpan", "Save") : tr("Tambah", "Add")}</button>
      </div>
    </form>
  );
}
