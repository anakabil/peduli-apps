"use client";

import { Lock } from "lucide-react";
import { saveSettingsAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { ROLES, ROLE_LABEL, type AppSettings } from "@/lib/constants";

function Row({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-5 py-3.5 last:border-b-0">
      <div>
        <div className="text-sm font-medium text-ink-800">{label}</div>
        {help && <div className="text-xs text-ink-500">{help}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ name, defaultChecked }: { name: string; defaultChecked: boolean }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="h-6 w-11 rounded-full bg-ink-200 transition-colors peer-checked:bg-brand-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export function SettingsForm({ settings: s, isAdmin }: { settings: AppSettings; isAdmin: boolean }) {
  const { pending, res, action } = useFormAction(saveSettingsAction);
  return (
    <form action={action} className="space-y-4">
      <div className="card overflow-hidden anim-fade-up">
        <div className="bg-brand-700 px-5 py-3 text-sm font-bold text-white">Pengaturan alur pelaporan</div>
        <Row label="Verifikasi Superintendent atas laporan Pengawas" help="Bersifat wajib dan terkunci."><span className="badge badge-warn"><Lock size={11} /> Wajib</span></Row>
        <Row label="Batas waktu verifikasi" help="Hari kerja sejak laporan dikirim."><div className="flex items-center gap-2"><input name="verifyDeadlineDays" type="number" min={1} max={30} defaultValue={s.verifyDeadlineDays} className="input w-20 text-center" /><span className="text-xs text-ink-500">hari kerja</span></div></Row>
        <Row label="Eskalasi langsung risiko Tinggi dan Ekstrem" help="Manager diberi tahu seketika, verifikasi tetap berjalan."><Toggle name="escalateHighRisk" defaultChecked={s.escalateHighRisk} /></Row>
        <Row label="Batas waktu keputusan Manager" help="Hari kerja sejak laporan terverifikasi."><div className="flex items-center gap-2"><input name="decideDeadlineDays" type="number" min={1} max={30} defaultValue={s.decideDeadlineDays} className="input w-20 text-center" /><span className="text-xs text-ink-500">hari kerja</span></div></Row>
        <Row label="Pengingat otomatis bila melewati batas waktu" help="Dikirim oleh penjadwal harian ke penanggung jawab tahap."><Toggle name="reminders" defaultChecked={s.reminders} /></Row>
        <Row label="Penugasan penanggung jawab berdasarkan area" help="Manager area menjadi usulan bawaan penanggung jawab."><Toggle name="picByArea" defaultChecked={s.picByArea} /></Row>
        <Row label="Laporan buatan Manager ditinjau Manager lain" help="Manager tidak menilai laporannya sendiri."><Toggle name="managerPeerReview" defaultChecked={s.managerPeerReview} /></Row>
      </div>

      <div className={`card overflow-hidden anim-fade-up ${!isAdmin ? "opacity-70" : ""}`}>
        <div className="bg-ink-800 px-5 py-3 text-sm font-bold text-white">Nilai poin {!isAdmin && <span className="font-normal text-white/60">(hanya admin)</span>}</div>
        <fieldset disabled={!isAdmin}>
          {[
            ["p_valid", "Laporan bahaya valid (kondisi atau tindakan)", s.points.valid],
            ["p_nearMiss", "Laporan nyaris celaka valid", s.points.nearMiss],
            ["p_highRiskBonus", "Bonus laporan risiko Tinggi atau Ekstrem", s.points.highRiskBonus],
            ["p_suggestionBonus", "Bonus usulan perbaikan yang diterapkan", s.points.suggestionBonus],
            ["p_streakBonus", "Bonus konsisten, empat minggu berturut", s.points.streakBonus],
          ].map(([k, label, v]) => (
            <Row key={String(k)} label={String(label)}><input name={String(k)} type="number" min={0} max={100} defaultValue={Number(v)} className="input w-20 text-center" /></Row>
          ))}
          <Row label="Ambang level Perak" help="Akumulasi poin yang diperoleh."><input name="l_perak" type="number" min={1} defaultValue={s.levels.perak} className="input w-24 text-center" /></Row>
          <Row label="Ambang level Emas"><input name="l_emas" type="number" min={1} defaultValue={s.levels.emas} className="input w-24 text-center" /></Row>
          <Row label="Peran yang berhak menerima poin" help="Keputusan awal: apakah Manager dan Direksi ikut memperoleh poin.">
            <div className="flex flex-wrap justify-end gap-2">
              {ROLES.filter((r) => r !== "ADMIN").map((r) => (
                <label key={r} className="inline-flex items-center gap-1.5 text-xs"><input type="checkbox" name={`elig_${r}`} defaultChecked={s.eligibleRoles.includes(r)} className="accent-[var(--brand-600)]" /> {ROLE_LABEL[r]}</label>
              ))}
            </div>
          </Row>
        </fieldset>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Msg res={res} />
        <button disabled={pending} className="btn-primary ml-auto">{pending ? "Menyimpan..." : "Simpan pengaturan"}</button>
      </div>
    </form>
  );
}
