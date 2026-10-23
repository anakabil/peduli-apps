"use client";

import { Lock } from "lucide-react";
import { saveSettingsAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { CardHeader } from "@/components/ui";
import { ROLES, ROLE_LABEL, type AppSettings } from "@/lib/constants";

// Label di atas kontrol pada layar sempit, berdampingan mulai sm; stacked memaksa susunan atas-bawah
function Row({ label, children, help, stacked = false }: { label: string; children: React.ReactNode; help?: string; stacked?: boolean }) {
  return (
    <div className={`flex flex-col gap-3 border-b border-ink-100 px-5 py-4 last:border-b-0 ${stacked ? "" : "sm:flex-row sm:items-center sm:justify-between sm:gap-6"}`}>
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink-800">{label}</div>
        {help && <div className="mt-0.5 text-xs text-ink-500">{help}</div>}
      </div>
      <div className={stacked ? "" : "sm:shrink-0"}>{children}</div>
    </div>
  );
}

function Toggle({ name, defaultChecked }: { name: string; defaultChecked: boolean }) {
  return (
    <label className="relative inline-flex min-h-11 cursor-pointer items-center">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative h-6 w-11 rounded-full bg-ink-200 transition-colors peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

function NumberWithSuffix({ name, defaultValue, suffix, min, max, width = "w-20" }: { name: string; defaultValue: number; suffix: string; min: number; max?: number; width?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input name={name} type="number" min={min} max={max} defaultValue={defaultValue} className={`input ${width} text-center tabular-nums`} />
      <span className="whitespace-nowrap text-sm text-ink-500">{suffix}</span>
    </div>
  );
}

export function SettingsForm({ settings: s, isAdmin }: { settings: AppSettings; isAdmin: boolean }) {
  const { pending, res, action } = useFormAction(saveSettingsAction);
  return (
    <form action={action} className="space-y-4">
      <div className="card overflow-hidden anim-fade-up">
        <CardHeader title="Alur pelaporan" subtitle="Urutan tahap, batas waktu, dan eskalasi otomatis." />
        <div className="mt-4 border-t border-ink-100">
          <Row label="Verifikasi Superintendent" help="Wajib untuk laporan Pengawas."><span className="badge badge-warn"><Lock size={11} /> Wajib</span></Row>
          <Row label="Batas waktu verifikasi" help="Hari kerja sejak laporan dikirim."><NumberWithSuffix name="verifyDeadlineDays" min={1} max={30} defaultValue={s.verifyDeadlineDays} suffix="hari kerja" /></Row>
          <Row label="Eskalasi risiko tinggi" help="Manager diberi tahu seketika, verifikasi tetap berjalan."><Toggle name="escalateHighRisk" defaultChecked={s.escalateHighRisk} /></Row>
          <Row label="Batas waktu keputusan" help="Hari kerja sejak laporan terverifikasi."><NumberWithSuffix name="decideDeadlineDays" min={1} max={30} defaultValue={s.decideDeadlineDays} suffix="hari kerja" /></Row>
          <Row label="Pengingat otomatis" help="Dikirim harian bila tahap melewati batas waktu."><Toggle name="reminders" defaultChecked={s.reminders} /></Row>
          <Row label="Penanggung jawab per area" help="Manager area menjadi usulan bawaan penanggung jawab."><Toggle name="picByArea" defaultChecked={s.picByArea} /></Row>
          <Row label="Tinjauan sesama Manager" help="Laporan Manager diputuskan Manager lain."><Toggle name="managerPeerReview" defaultChecked={s.managerPeerReview} /></Row>
        </div>
      </div>

      <div className="card overflow-hidden anim-fade-up">
        <CardHeader
          title="Nilai poin"
          subtitle="Poin per laporan valid, bonus, dan ambang level."
          action={!isAdmin ? <span className="badge badge-neutral shrink-0"><Lock size={11} /> Hanya admin</span> : undefined}
        />
        <fieldset disabled={!isAdmin} className={`mt-4 border-t border-ink-100 ${!isAdmin ? "opacity-70" : ""}`}>
          {[
            ["p_valid", "Laporan bahaya valid (kondisi atau tindakan)", s.points.valid],
            ["p_nearMiss", "Laporan nyaris celaka valid", s.points.nearMiss],
            ["p_highRiskBonus", "Bonus laporan risiko Tinggi atau Ekstrem", s.points.highRiskBonus],
            ["p_suggestionBonus", "Bonus usulan perbaikan yang diterapkan", s.points.suggestionBonus],
            ["p_streakBonus", "Bonus konsisten, empat minggu berturut", s.points.streakBonus],
          ].map(([k, label, v]) => (
            <Row key={String(k)} label={String(label)}><NumberWithSuffix name={String(k)} min={0} max={100} defaultValue={Number(v)} suffix="poin" /></Row>
          ))}
          <Row label="Ambang level Perak" help="Akumulasi poin yang diperoleh."><NumberWithSuffix name="l_perak" min={1} defaultValue={s.levels.perak} suffix="poin" width="w-24" /></Row>
          <Row label="Ambang level Emas"><NumberWithSuffix name="l_emas" min={1} defaultValue={s.levels.emas} suffix="poin" width="w-24" /></Row>
          <Row label="Penerima poin" help="Apakah Manager dan Direksi ikut memperoleh poin." stacked>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {ROLES.filter((r) => r !== "ADMIN").map((r) => (
                <label key={r} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink-800 sm:min-h-0">
                  <input type="checkbox" name={`elig_${r}`} defaultChecked={s.eligibleRoles.includes(r)} className="size-5 shrink-0 accent-[var(--brand-600)]" />
                  {ROLE_LABEL[r]}
                </label>
              ))}
            </div>
          </Row>
        </fieldset>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Msg res={res} />
        <button disabled={pending} className="btn-primary min-h-11 sm:ml-auto">{pending ? "Menyimpan..." : "Simpan pengaturan"}</button>
      </div>
    </form>
  );
}
