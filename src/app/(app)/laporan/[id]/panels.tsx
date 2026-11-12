"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, XCircle, ThumbsUp, ThumbsDown, Wrench, Flag, Camera, Send, ShieldCheck, Sparkles } from "lucide-react";
import { verifyAction, decideAction, progressAction, closeAction, resubmitAction, auditSampleAction, type ActionResult } from "./actions";
import { CONTROLS, CATEGORIES, RISKS, REJECT_REASONS, labels } from "@/lib/constants";
import { useLang, useTr } from "@/components/i18n/lang-provider";
import type { Tr } from "@/lib/i18n";
import { Field } from "@/components/ui";
import { ChoiceGrid } from "@/components/ui/choice-grid";

function useAction(fn: (fd: FormData) => Promise<ActionResult>) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const router = useRouter();
  const submit = (fd: FormData) =>
    start(async () => {
      const r = await fn(fd);
      setMsg(r);
      if (r.ok) router.refresh();
    });
  return { pending, msg, submit };
}

type Tone = "good" | "warn" | "bad";
const TONE_ON: Record<Tone, string> = {
  good: "border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-600",
  warn: "border-[#c9940f] bg-amber/10 text-[#7a5c06] ring-1 ring-[#c9940f]",
  bad: "border-red bg-red/5 text-[#a3262a] ring-1 ring-red",
};

/** Tombol pilihan hasil: garis tepi berwarna dan latar lembut saat dipilih, bukan blok warna penuh */
function Outcome({ active, tone, onClick, children }: { active: boolean; tone: Tone; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors ${active ? TONE_ON[tone] : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"}`}>
      {children}
    </button>
  );
}

const controlHint = (tr: Tr): Record<string, string> => ({
  ELIMINASI: tr("Menghilangkan sumber bahaya", "Remove the hazard source"),
  SUBSTITUSI: tr("Mengganti dengan bahan atau cara yang lebih aman", "Replace with a safer material or method"),
  REKAYASA_TEKNIK: tr("Memisahkan pekerja dari bahaya, misalnya pelindung mesin", "Isolate workers from the hazard, for example machine guarding"),
  ADMINISTRATIF: tr("Prosedur, rambu, izin kerja, pelatihan", "Procedures, signage, work permits, training"),
  APD: tr("Alat pelindung diri sebagai lapis terakhir", "Personal protective equipment as the last line of defence"),
});

/** Alasan penolakan yang sama untuk verifikasi dan keputusan, agar penolakan dapat ditelusuri di statistik */
function RejectReasonSelect() {
  const L = labels(useLang());
  return (
    <select name="rejectReason" className="input" defaultValue="TIDAK_PERLU_TINDAKAN">
      {REJECT_REASONS.map((r) => (
        <option key={r} value={r}>
          {L.REJECT_REASON_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

function Feedback({ msg }: { msg: ActionResult | null }) {
  const tr = useTr();
  if (!msg) return null;
  return msg.ok ? (
    <div className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700 anim-fade-in">{msg.message ?? tr("Tersimpan.", "Saved.")}</div>
  ) : (
    <div className="rounded-xl bg-red/5 px-3 py-2 text-sm text-red anim-fade-in">{msg.error}</div>
  );
}

export function VerifyPanel({ reportId }: { reportId: string }) {
  const tr = useTr();
  const { pending, msg, submit } = useAction((fd) => verifyAction(reportId, fd));
  const [result, setResult] = useState<"VALID" | "REVISI" | "TOLAK">("VALID");
  return (
    <form action={submit} className="card border-brand-200 p-5 anim-fade-up">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-brand-600" />
        <h3 className="font-bold">{tr("Verifikasi laporan Pengawas", "Verify Supervisor report")}</h3>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
        {[tr("Foto sesuai lokasi dan waktu", "Photos match the location and time"), tr("Uraian bahaya jelas dan lengkap", "Hazard description is clear and complete"), tr("Bukan laporan ganda", "Not a duplicate report")].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-600" /> {t}
          </li>
        ))}
      </ul>
      <input type="hidden" name="result" value={result} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Outcome active={result === "VALID"} tone="good" onClick={() => setResult("VALID")}>
          <CheckCircle2 size={16} /> {tr("Valid", "Valid")}
        </Outcome>
        <Outcome active={result === "REVISI"} tone="warn" onClick={() => setResult("REVISI")}>
          <RotateCcw size={16} /> {tr("Revisi", "Revise")}
        </Outcome>
        <Outcome active={result === "TOLAK"} tone="bad" onClick={() => setResult("TOLAK")}>
          <XCircle size={16} /> {tr("Tolak", "Reject")}
        </Outcome>
      </div>
      {result === "TOLAK" && (
        <div className="mt-4 anim-fade-in">
          <Field label={tr("Alasan penolakan", "Rejection reason")} required>
            <RejectReasonSelect />
          </Field>
        </div>
      )}
      <div className="mt-4">
        <Field label={result === "VALID" ? tr("Catatan", "Note") : tr("Penjelasan untuk pelapor", "Explanation for the reporter")} required={result !== "VALID"}>
          <textarea name="note" className="input min-h-20" placeholder={result === "TOLAK" ? tr("Contoh: sama dengan laporan PDL-..., atau foto tidak sesuai lokasi.", "Example: same as report PDL-..., or photo does not match the location.") : tr("Tulis catatan.", "Write a note.")} />
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button disabled={pending} className="btn-primary ml-auto">
          {pending ? tr("Menyimpan...", "Saving...") : tr("Simpan verifikasi", "Save verification")}
        </button>
      </div>
    </form>
  );
}

export function DecidePanel({ reportId, candidates, hasSuggestion, defaultPicId }: { reportId: string; candidates: Array<{ id: string; name: string; role: string; jabatan: string | null }>; hasSuggestion: boolean; defaultPicId?: string | null }) {
  const tr = useTr();
  const L = labels(useLang());
  const CONTROL_HINT = controlHint(tr);
  const { pending, msg, submit } = useAction((fd) => decideAction(reportId, fd));
  const [result, setResult] = useState<"SETUJU" | "TOLAK">("SETUJU");
  const [control, setControl] = useState<string>("");
  const [picMode, setPicMode] = useState<"daftar" | "manual">("daftar");
  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return (
    <form action={submit} className="card border-brand-200 p-5 anim-fade-up">
      <div className="flex items-center gap-2">
        <Flag size={18} className="text-brand-600" />
        <h3 className="font-bold">{tr("Keputusan Manager", "Manager decision")}</h3>
      </div>
      <input type="hidden" name="result" value={result} />
      <input type="hidden" name="controlHierarchy" value={control} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Outcome active={result === "SETUJU"} tone="good" onClick={() => setResult("SETUJU")}>
          <ThumbsUp size={16} /> {tr("Setujui", "Approve")}
        </Outcome>
        <Outcome active={result === "TOLAK"} tone="bad" onClick={() => setResult("TOLAK")}>
          <ThumbsDown size={16} /> {tr("Tolak", "Reject")}
        </Outcome>
      </div>

      {result === "SETUJU" ? (
        <div className="mt-4 space-y-4 anim-fade-in">
          <Field label={tr("Penanggung jawab", "Person in charge (PIC)")} required>
            <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-ink-100 p-1 text-[13px] font-medium">
              {(["daftar", "manual"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={picMode === m} onClick={() => setPicMode(m)} className={`min-h-9 rounded-lg transition-colors ${picMode === m ? "bg-white text-ink-900 shadow-sm" : "text-ink-600"}`}>
                  {m === "daftar" ? tr("Pengguna terdaftar", "Registered user") : tr("Tulis manual", "Enter manually")}
                </button>
              ))}
            </div>
            {picMode === "daftar" ? (
              <select name="picId" className="input" defaultValue={defaultPicId ?? ""}>
                <option value="">{tr("Pilih dari daftar pengguna", "Select from user list")}</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.jabatan ?? c.role})
                  </option>
                ))}
              </select>
            ) : (
              <input name="picName" className="input" placeholder={tr("Jabatan atau nama penanggung jawab", "Position or name of the person in charge")} />
            )}
          </Field>
          <div className="grid grid-cols-1 gap-3">
            <Field label={tr("Tenaga", "Manpower")}>
              <input name="resourceTenaga" className="input" placeholder={tr("Contoh: 2 teknisi", "Example: 2 technicians")} />
            </Field>
            <Field label={tr("Biaya", "Cost")}>
              <input name="resourceBiaya" className="input" placeholder={tr("Contoh: Rp1.500.000", "Example: Rp1,500,000")} />
            </Field>
            <Field label={tr("Material", "Material")}>
              <input name="resourceMaterial" className="input" placeholder={tr("Contoh: rambu, penutup", "Example: signs, covers")} />
            </Field>
          </div>
          <Field label={tr("Target selesai", "Target date")} required>
            <input type="date" name="targetDate" className="input" min={minDate} required />
          </Field>
          <Field label={tr("Hierarki pengendalian", "Hierarchy of controls")} required help={tr("Urut dari yang paling efektif.", "Ordered from most to least effective.")}>
            <ChoiceGrid
              multiple={false}
              className="grid-cols-1! sm:grid-cols-1!"
              ariaLabel={tr("Hierarki pengendalian", "Hierarchy of controls")}
              options={CONTROLS.map((c, i) => ({ key: c, label: `${i + 1}. ${L.CONTROL_LABEL[c]}`, hint: CONTROL_HINT[c] }))}
              selected={control ? [control] : []}
              onToggle={(k) => setControl(k)}
            />
          </Field>
          <Field label={tr("Catatan keputusan", "Decision note")}>
            <textarea name="note" className="input min-h-16" />
          </Field>
        </div>
      ) : (
        <div className="mt-4 space-y-4 anim-fade-in">
          <Field label={tr("Alasan penolakan", "Rejection reason")} required>
            <RejectReasonSelect />
          </Field>
          <Field label={tr("Penjelasan untuk pelapor", "Explanation for the reporter")} required>
            <textarea name="note" className="input min-h-20" required />
          </Field>
        </div>
      )}
      {hasSuggestion && result === "SETUJU" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
          <Sparkles size={13} className="text-gold" /> {tr("Pelapor menyertakan tindakan pencegahan.", "The reporter included a preventive action.")}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button disabled={pending} className="btn-primary ml-auto">
          {pending ? tr("Menyimpan...", "Saving...") : tr("Simpan keputusan", "Save decision")}
        </button>
      </div>
    </form>
  );
}

export function ProgressPanel({ reportId, current }: { reportId: string; current: number }) {
  const tr = useTr();
  const { pending, msg, submit } = useAction((fd) => progressAction(reportId, fd));
  const [pct, setPct] = useState(Math.max(current, 10));
  const [done, setDone] = useState(false);
  return (
    <form action={submit} className="card border-brand-200 p-5 anim-fade-up">
      <div className="flex items-center gap-2">
        <Wrench size={18} className="text-brand-600" />
        <h3 className="font-bold">{tr("Pembaruan perbaikan", "Corrective action update")}</h3>
      </div>
      <input type="hidden" name="pct" value={pct} />
      <input type="hidden" name="done" value={done ? "true" : "false"} />
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">{tr("Progres", "Progress")}</span>
          <span className="font-bold text-brand-700">{done ? 100 : pct}%</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={done ? 100 : pct} disabled={done} onChange={(e) => setPct(Number(e.target.value))} className="mt-2 w-full accent-[var(--brand-600)]" />
      </div>
      <label className="mt-4 flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm">
        <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} className="size-5 accent-[var(--brand-600)]" />
        {tr("Perbaikan selesai, ajukan penutupan", "Corrective action complete, request closure")}
      </label>
      <div className="mt-4">
        <Field label={tr("Catatan", "Note")} required>
          <textarea name="note" className="input min-h-16" placeholder={tr("Apa yang sudah dikerjakan.", "What has been done.")} required />
        </Field>
      </div>
      <div className="mt-3">
        <Field label={tr("Foto bukti perbaikan", "Corrective action evidence photo")}>
          <label className="btn-secondary cursor-pointer">
            <Camera size={16} /> {tr("Ambil foto", "Take photo")}
            <input type="file" name="photo" accept="image/*" capture="environment" className="hidden" />
          </label>
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button disabled={pending} className="btn-primary ml-auto">
          <Send size={16} /> {pending ? tr("Menyimpan...", "Saving...") : done ? tr("Ajukan penutupan", "Request closure") : tr("Simpan progres", "Save progress")}
        </button>
      </div>
    </form>
  );
}

export function ClosePanel({ reportId, hasSuggestion }: { reportId: string; hasSuggestion: boolean }) {
  const tr = useTr();
  const { pending, msg, submit } = useAction((fd) => closeAction(reportId, fd));
  const [accepted, setAccepted] = useState(true);
  return (
    <form action={submit} className="card border-brand-200 p-5 anim-fade-up">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className="text-brand-600" />
        <h3 className="font-bold">{tr("Verifikasi hasil dan penutupan", "Result verification and closure")}</h3>
      </div>
      <input type="hidden" name="accepted" value={accepted ? "true" : "false"} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setAccepted(true)} className={`btn ${accepted ? "btn-success" : "btn-secondary"}`}>
          {tr("Hasil diterima, tutup", "Result accepted, close")}
        </button>
        <button type="button" onClick={() => setAccepted(false)} className={`btn ${!accepted ? "btn-warn" : "btn-secondary"}`}>
          {tr("Belum diterima", "Not yet accepted")}
        </button>
      </div>
      {hasSuggestion && accepted && (
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/5 px-3 py-2.5 text-sm">
          <input type="checkbox" name="suggestionApplied" className="size-5 accent-[var(--brand-600)]" />
          {tr("Tindakan pencegahan dari pelapor diterapkan", "The reporter's preventive action was implemented")}
        </label>
      )}
      <div className="mt-4">
        <Field label={tr("Catatan penutupan", "Closure note")} required={!accepted}>
          <textarea name="note" className="input min-h-16" placeholder={accepted ? tr("Hasil diverifikasi di lapangan.", "Result verified in the field.") : tr("Apa yang masih perlu disempurnakan.", "What still needs improvement.")} />
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button disabled={pending} className="btn-primary ml-auto">
          {pending ? tr("Menyimpan...", "Saving...") : tr("Simpan", "Save")}
        </button>
      </div>
    </form>
  );
}

export function ResubmitPanel({ report }: { report: { id: string; category: string; riskLevel: string; description: string; suggestion: string | null; areaLabel: string | null; verificationNote: string | null } }) {
  const tr = useTr();
  const L = labels(useLang());
  const { pending, msg, submit } = useAction((fd) => resubmitAction(report.id, fd));
  return (
    <form action={submit} className="card border-amber/50 p-5 anim-fade-up">
      <div className="flex items-center gap-2">
        <RotateCcw size={18} className="text-[#8a6a0a]" />
        <h3 className="font-bold">{tr("Perbaiki dan kirim ulang", "Revise and resubmit")}</h3>
      </div>
      {report.verificationNote && <div className="mt-3 rounded-xl bg-amber/10 px-3 py-2 text-sm text-ink-800">{tr("Catatan Superintendent:", "Superintendent note:")} {report.verificationNote}</div>}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={tr("Jenis bahaya", "Hazard type")}>
          <select name="category" className="input" defaultValue={report.category}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{L.CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </Field>
        <Field label={tr("Risiko awal", "Initial risk")}>
          <select name="riskLevel" className="input" defaultValue={report.riskLevel}>
            {RISKS.map((r) => (
              <option key={r} value={r}>{L.RISK_LABEL[r]}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-3 space-y-3">
        <Field label={tr("Keterangan lokasi", "Location details")}>
          <input name="areaLabel" className="input" defaultValue={report.areaLabel ?? ""} />
        </Field>
        <Field label={tr("Uraian bahaya", "Hazard description")} required>
          <textarea name="description" className="input min-h-20" defaultValue={report.description} />
        </Field>
        <Field label={tr("Usulan perbaikan", "Suggested action")}>
          <textarea name="suggestion" className="input min-h-16" defaultValue={report.suggestion ?? ""} />
        </Field>
        <Field label={tr("Catatan revisi", "Revision note")}>
          <input name="note" className="input" placeholder={tr("Apa yang diperbaiki.", "What was revised.")} />
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button disabled={pending} className="btn-primary ml-auto">
          {pending ? tr("Mengirim...", "Submitting...") : tr("Kirim revisi", "Submit revision")}
        </button>
      </div>
    </form>
  );
}

export function AuditButton({ reportId, sampled }: { reportId: string; sampled: boolean }) {
  const tr = useTr();
  const [pending, start] = useTransition();
  const router = useRouter();
  if (sampled) return <span className="badge badge-neutral">{tr("Telah diaudit", "Audited")}</span>;
  return (
    <button
      className="btn-secondary btn-sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await auditSampleAction(reportId, "Audit acak tim pengelola");
          router.refresh();
        })
      }
    >
      {tr("Tandai audit acak", "Mark random audit")}
    </button>
  );
}
