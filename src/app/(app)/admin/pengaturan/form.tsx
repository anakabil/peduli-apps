"use client";

import { Lock } from "lucide-react";
import { saveSettingsAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { CardHeader } from "@/components/ui";
import { ROLES, NOTIF_TYPES, labels, type AppSettings } from "@/lib/constants";
import { useLang, useTr } from "@/components/i18n/lang-provider";

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
  const tr = useTr();
  const L = labels(useLang());
  const days = tr("hari kerja", "working days");
  const pts = tr("poin", "points");
  return (
    <form action={action} className="space-y-4">
      <div className="card overflow-hidden anim-fade-up">
        <CardHeader title={tr("Alur pelaporan", "Reporting workflow")} subtitle={tr("Urutan tahap, batas waktu, dan eskalasi otomatis.", "Stage sequence, deadlines, and automatic escalation.")} />
        <div className="mt-4 border-t border-ink-100">
          <Row label={tr("Verifikasi Superintendent", "Superintendent verification")} help={tr("Wajib untuk laporan Pengawas.", "Required for Supervisor reports.")}><span className="badge badge-warn"><Lock size={11} /> {tr("Wajib", "Required")}</span></Row>
          <Row label={tr("Batas waktu verifikasi", "Verification deadline")} help={tr("Hari kerja sejak laporan dikirim.", "Working days from report submission.")}><NumberWithSuffix name="verifyDeadlineDays" min={1} max={30} defaultValue={s.verifyDeadlineDays} suffix={days} /></Row>
          <Row label={tr("Eskalasi risiko tinggi", "High-risk escalation")} help={tr("Manager diberi tahu seketika, verifikasi tetap berjalan.", "Managers are notified immediately; verification continues.")}><Toggle name="escalateHighRisk" defaultChecked={s.escalateHighRisk} /></Row>
          <Row label={tr("Batas waktu keputusan", "Decision deadline")} help={tr("Hari kerja sejak laporan terverifikasi.", "Working days from report verification.")}><NumberWithSuffix name="decideDeadlineDays" min={1} max={30} defaultValue={s.decideDeadlineDays} suffix={days} /></Row>
          <Row label={tr("Pengingat otomatis", "Automatic reminders")} help={tr("Dikirim harian bila tahap melewati batas waktu.", "Sent daily when a stage passes its deadline.")}><Toggle name="reminders" defaultChecked={s.reminders} /></Row>
          <Row label={tr("Penanggung jawab per area", "Person in charge by area")} help={tr("Manager area menjadi usulan bawaan penanggung jawab.", "The area Manager is the default suggested person in charge.")}><Toggle name="picByArea" defaultChecked={s.picByArea} /></Row>
          <Row label={tr("Tinjauan sesama Manager", "Manager peer review")} help={tr("Laporan Manager diputuskan Manager lain.", "A Manager's reports are decided by another Manager.")}><Toggle name="managerPeerReview" defaultChecked={s.managerPeerReview} /></Row>
        </div>
      </div>

      <div className="card overflow-hidden anim-fade-up">
        <CardHeader
          title={tr("Nilai poin", "Point values")}
          subtitle={tr("Poin per laporan valid, bonus, dan ambang level.", "Points per valid report, bonuses, and level thresholds.")}
          action={!isAdmin ? <span className="badge badge-neutral shrink-0"><Lock size={11} /> {tr("Hanya admin", "Admin only")}</span> : undefined}
        />
        <fieldset disabled={!isAdmin} className={`mt-4 border-t border-ink-100 ${!isAdmin ? "opacity-70" : ""}`}>
          {[
            ["p_valid", tr("Laporan bahaya valid (kondisi atau tindakan)", "Valid hazard report (condition or act)"), s.points.valid],
            ["p_nearMiss", tr("Laporan nyaris celaka valid", "Valid near-miss report"), s.points.nearMiss],
            ["p_highRiskBonus", tr("Bonus laporan risiko Tinggi atau Ekstrem", "High or Extreme risk report bonus"), s.points.highRiskBonus],
            ["p_suggestionBonus", tr("Bonus usulan perbaikan yang diterapkan", "Implemented suggested action bonus"), s.points.suggestionBonus],
            ["p_streakBonus", tr("Bonus konsisten, empat minggu berturut", "Consistency bonus, four consecutive weeks"), s.points.streakBonus],
          ].map(([k, label, v]) => (
            <Row key={String(k)} label={String(label)}><NumberWithSuffix name={String(k)} min={0} max={100} defaultValue={Number(v)} suffix={pts} /></Row>
          ))}
          <Row label={tr("Ambang level Perak", "Silver level threshold")} help={tr("Akumulasi poin yang diperoleh.", "Cumulative points earned.")}><NumberWithSuffix name="l_perak" min={1} defaultValue={s.levels.perak} suffix={pts} width="w-24" /></Row>
          <Row label={tr("Ambang level Emas", "Gold level threshold")}><NumberWithSuffix name="l_emas" min={1} defaultValue={s.levels.emas} suffix={pts} width="w-24" /></Row>
          <Row label={tr("Penerima poin", "Point recipients")} help={tr("Apakah Manager dan Direksi ikut memperoleh poin.", "Whether Managers and Directors also earn points.")} stacked>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {ROLES.filter((r) => r !== "ADMIN").map((r) => (
                <label key={r} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink-800 sm:min-h-0">
                  <input type="checkbox" name={`elig_${r}`} defaultChecked={s.eligibleRoles.includes(r)} className="size-5 shrink-0 accent-[var(--brand-600)]" />
                  {L.ROLE_LABEL[r]}
                </label>
              ))}
            </div>
          </Row>
        </fieldset>
      </div>

      <div className="card overflow-hidden anim-fade-up">
        <CardHeader
          title={tr("Notifikasi ponsel", "Phone notifications")}
          subtitle={tr("Jenis notifikasi yang dikirim ke aplikasi terpasang. Daftar notifikasi di aplikasi tetap lengkap.", "Notification types sent to the installed app. The in-app notification list remains complete.")}
        />
        <div className="mt-4 border-t border-ink-100">
          {NOTIF_TYPES.map((t) => (
            <Row key={t} label={L.NOTIF_TYPE_LABEL[t]} help={L.NOTIF_TYPE_DESC[t]}><Toggle name={`push_${t}`} defaultChecked={s.push[t]} /></Row>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Msg res={res} />
        <button disabled={pending} className="btn-primary min-h-11 sm:ml-auto">{pending ? tr("Menyimpan...", "Saving...") : tr("Simpan pengaturan", "Save settings")}</button>
      </div>
    </form>
  );
}
