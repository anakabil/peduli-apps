"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, XCircle, ThumbsUp, ThumbsDown, Wrench, Flag, Camera, Send, ShieldCheck, Sparkles } from "lucide-react";
import { verifyAction, decideAction, progressAction, closeAction, resubmitAction, auditSampleAction, type ActionResult } from "./actions";
import { CONTROLS, CONTROL_LABEL, CATEGORIES, CATEGORY_LABEL, RISKS, RISK_LABEL, REJECT_REASONS, REJECT_REASON_LABEL } from "@/lib/constants";
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

const CONTROL_HINT: Record<string, string> = {
  ELIMINASI: "Menghilangkan sumber bahaya",
  SUBSTITUSI: "Mengganti dengan bahan atau cara yang lebih aman",
  REKAYASA_TEKNIK: "Memisahkan pekerja dari bahaya, misalnya pelindung mesin",
  ADMINISTRATIF: "Prosedur, rambu, izin kerja, pelatihan",
  APD: "Alat pelindung diri sebagai lapis terakhir",
};

/** Alasan penolakan yang sama untuk verifikasi dan keputusan, agar penolakan dapat ditelusuri di statistik */
function RejectReasonSelect() {
  return (
    <select name="rejectReason" className="input" defaultValue="TIDAK_PERLU_TINDAKAN">
      {REJECT_REASONS.map((r) => (
        <option key={r} value={r}>
          {REJECT_REASON_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

function Feedback({ msg }: { msg: ActionResult | null }) {
  if (!msg) return null;
  return msg.ok ? (
    <div className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700 anim-fade-in">{msg.message ?? "Tersimpan."}</div>
  ) : (
    <div className="rounded-xl bg-red/5 px-3 py-2 text-sm text-red anim-fade-in">{msg.error}</div>
  );
}

export function VerifyPanel({ reportId }: { reportId: string }) {
  const { pending, msg, submit } = useAction((fd) => verifyAction(reportId, fd));
  const [result, setResult] = useState<"VALID" | "REVISI" | "TOLAK">("VALID");
  return (
    <form action={submit} className="card border-brand-200 p-5 anim-fade-up">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-brand-600" />
        <h3 className="font-bold">Verifikasi laporan Pengawas</h3>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
        {["Foto sesuai lokasi dan waktu", "Uraian bahaya jelas dan lengkap", "Bukan laporan ganda"].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-600" /> {t}
          </li>
        ))}
      </ul>
      <input type="hidden" name="result" value={result} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Outcome active={result === "VALID"} tone="good" onClick={() => setResult("VALID")}>
          <CheckCircle2 size={16} /> Valid
        </Outcome>
        <Outcome active={result === "REVISI"} tone="warn" onClick={() => setResult("REVISI")}>
          <RotateCcw size={16} /> Revisi
        </Outcome>
        <Outcome active={result === "TOLAK"} tone="bad" onClick={() => setResult("TOLAK")}>
          <XCircle size={16} /> Tolak
        </Outcome>
      </div>
      {result === "TOLAK" && (
        <div className="mt-4 anim-fade-in">
          <Field label="Alasan penolakan" required>
            <RejectReasonSelect />
          </Field>
        </div>
      )}
      <div className="mt-4">
        <Field label={result === "VALID" ? "Catatan" : "Penjelasan untuk pelapor"} required={result !== "VALID"}>
          <textarea name="note" className="input min-h-20" placeholder={result === "TOLAK" ? "Contoh: sama dengan laporan PDL-..., atau foto tidak sesuai lokasi." : "Tulis catatan."} />
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button disabled={pending} className="btn-primary ml-auto">
          {pending ? "Menyimpan..." : "Simpan verifikasi"}
        </button>
      </div>
    </form>
  );
}

export function DecidePanel({ reportId, candidates, hasSuggestion, defaultPicId }: { reportId: string; candidates: Array<{ id: string; name: string; role: string; jabatan: string | null }>; hasSuggestion: boolean; defaultPicId?: string | null }) {
  const { pending, msg, submit } = useAction((fd) => decideAction(reportId, fd));
  const [result, setResult] = useState<"SETUJU" | "TOLAK">("SETUJU");
  const [control, setControl] = useState<string>("");
  const [picMode, setPicMode] = useState<"daftar" | "manual">("daftar");
  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return (
    <form action={submit} className="card border-brand-200 p-5 anim-fade-up">
      <div className="flex items-center gap-2">
        <Flag size={18} className="text-brand-600" />
        <h3 className="font-bold">Keputusan Manager</h3>
      </div>
      <input type="hidden" name="result" value={result} />
      <input type="hidden" name="controlHierarchy" value={control} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Outcome active={result === "SETUJU"} tone="good" onClick={() => setResult("SETUJU")}>
          <ThumbsUp size={16} /> Setujui
        </Outcome>
        <Outcome active={result === "TOLAK"} tone="bad" onClick={() => setResult("TOLAK")}>
          <ThumbsDown size={16} /> Tolak
        </Outcome>
      </div>

      {result === "SETUJU" ? (
        <div className="mt-4 space-y-4 anim-fade-in">
          <Field label="Penanggung jawab" required>
            <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-ink-100 p-1 text-[13px] font-medium">
              {(["daftar", "manual"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={picMode === m} onClick={() => setPicMode(m)} className={`min-h-9 rounded-lg transition-colors ${picMode === m ? "bg-white text-ink-900 shadow-sm" : "text-ink-600"}`}>
                  {m === "daftar" ? "Pengguna terdaftar" : "Tulis manual"}
                </button>
              ))}
            </div>
            {picMode === "daftar" ? (
              <select name="picId" className="input" defaultValue={defaultPicId ?? ""}>
                <option value="">Pilih dari daftar pengguna</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.jabatan ?? c.role})
                  </option>
                ))}
              </select>
            ) : (
              <input name="picName" className="input" placeholder="Jabatan atau nama penanggung jawab" />
            )}
          </Field>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Tenaga">
              <input name="resourceTenaga" className="input" placeholder="Contoh: 2 teknisi" />
            </Field>
            <Field label="Biaya">
              <input name="resourceBiaya" className="input" placeholder="Contoh: Rp1.500.000" />
            </Field>
            <Field label="Material">
              <input name="resourceMaterial" className="input" placeholder="Contoh: rambu, penutup" />
            </Field>
          </div>
          <Field label="Target selesai" required>
            <input type="date" name="targetDate" className="input" min={minDate} required />
          </Field>
          <Field label="Hierarki pengendalian" required help="Urut dari yang paling efektif.">
            <ChoiceGrid
              multiple={false}
              className="grid-cols-1 sm:grid-cols-1"
              ariaLabel="Hierarki pengendalian"
              options={CONTROLS.map((c, i) => ({ key: c, label: `${i + 1}. ${CONTROL_LABEL[c]}`, hint: CONTROL_HINT[c] }))}
              selected={control ? [control] : []}
              onToggle={(k) => setControl(k)}
            />
          </Field>
          <Field label="Catatan keputusan">
            <textarea name="note" className="input min-h-16" />
          </Field>
        </div>
      ) : (
        <div className="mt-4 space-y-4 anim-fade-in">
          <Field label="Alasan penolakan" required>
            <RejectReasonSelect />
          </Field>
          <Field label="Penjelasan untuk pelapor" required>
            <textarea name="note" className="input min-h-20" required />
          </Field>
        </div>
      )}
      {hasSuggestion && result === "SETUJU" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
          <Sparkles size={13} className="text-gold" /> Pelapor menyertakan tindakan pencegahan.
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button disabled={pending} className="btn-primary ml-auto">
          {pending ? "Menyimpan..." : "Simpan keputusan"}
        </button>
      </div>
    </form>
  );
}

export function ProgressPanel({ reportId, current }: { reportId: string; current: number }) {
  const { pending, msg, submit } = useAction((fd) => progressAction(reportId, fd));
  const [pct, setPct] = useState(Math.max(current, 10));
  const [done, setDone] = useState(false);
  return (
    <form action={submit} className="card border-brand-200 p-5 anim-fade-up">
      <div className="flex items-center gap-2">
        <Wrench size={18} className="text-brand-600" />
        <h3 className="font-bold">Pembaruan perbaikan</h3>
      </div>
      <input type="hidden" name="pct" value={pct} />
      <input type="hidden" name="done" value={done ? "true" : "false"} />
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Progres</span>
          <span className="font-bold text-brand-700">{done ? 100 : pct}%</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={done ? 100 : pct} disabled={done} onChange={(e) => setPct(Number(e.target.value))} className="mt-2 w-full accent-[var(--brand-600)]" />
      </div>
      <label className="mt-4 flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm">
        <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} className="size-5 accent-[var(--brand-600)]" />
        Perbaikan selesai, ajukan penutupan
      </label>
      <div className="mt-4">
        <Field label="Catatan" required>
          <textarea name="note" className="input min-h-16" placeholder="Apa yang sudah dikerjakan." required />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Foto bukti perbaikan">
          <label className="btn-secondary cursor-pointer">
            <Camera size={16} /> Ambil foto
            <input type="file" name="photo" accept="image/*" capture="environment" className="hidden" />
          </label>
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button disabled={pending} className="btn-primary ml-auto">
          <Send size={16} /> {pending ? "Menyimpan..." : done ? "Ajukan penutupan" : "Simpan progres"}
        </button>
      </div>
    </form>
  );
}

export function ClosePanel({ reportId, hasSuggestion }: { reportId: string; hasSuggestion: boolean }) {
  const { pending, msg, submit } = useAction((fd) => closeAction(reportId, fd));
  const [accepted, setAccepted] = useState(true);
  return (
    <form action={submit} className="card border-brand-200 p-5 anim-fade-up">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className="text-brand-600" />
        <h3 className="font-bold">Verifikasi hasil dan penutupan</h3>
      </div>
      <input type="hidden" name="accepted" value={accepted ? "true" : "false"} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setAccepted(true)} className={`btn ${accepted ? "btn-success" : "btn-secondary"}`}>
          Hasil diterima, tutup
        </button>
        <button type="button" onClick={() => setAccepted(false)} className={`btn ${!accepted ? "btn-warn" : "btn-secondary"}`}>
          Belum diterima
        </button>
      </div>
      {hasSuggestion && accepted && (
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/5 px-3 py-2.5 text-sm">
          <input type="checkbox" name="suggestionApplied" className="size-5 accent-[var(--brand-600)]" />
          Tindakan pencegahan dari pelapor diterapkan
        </label>
      )}
      <div className="mt-4">
        <Field label="Catatan penutupan" required={!accepted}>
          <textarea name="note" className="input min-h-16" placeholder={accepted ? "Hasil diverifikasi di lapangan." : "Apa yang masih perlu disempurnakan."} />
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button disabled={pending} className="btn-primary ml-auto">
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}

export function ResubmitPanel({ report }: { report: { id: string; category: string; riskLevel: string; description: string; suggestion: string | null; areaLabel: string | null; verificationNote: string | null } }) {
  const { pending, msg, submit } = useAction((fd) => resubmitAction(report.id, fd));
  return (
    <form action={submit} className="card border-amber/50 p-5 anim-fade-up">
      <div className="flex items-center gap-2">
        <RotateCcw size={18} className="text-[#8a6a0a]" />
        <h3 className="font-bold">Perbaiki dan kirim ulang</h3>
      </div>
      {report.verificationNote && <div className="mt-3 rounded-xl bg-amber/10 px-3 py-2 text-sm text-ink-800">Catatan Superintendent: {report.verificationNote}</div>}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Kategori">
          <select name="category" className="input" defaultValue={report.category}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="Risiko awal">
          <select name="riskLevel" className="input" defaultValue={report.riskLevel}>
            {RISKS.map((r) => (
              <option key={r} value={r}>{RISK_LABEL[r]}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-3 space-y-3">
        <Field label="Keterangan lokasi">
          <input name="areaLabel" className="input" defaultValue={report.areaLabel ?? ""} />
        </Field>
        <Field label="Uraian bahaya" required>
          <textarea name="description" className="input min-h-20" defaultValue={report.description} />
        </Field>
        <Field label="Usulan perbaikan">
          <textarea name="suggestion" className="input min-h-16" defaultValue={report.suggestion ?? ""} />
        </Field>
        <Field label="Catatan revisi">
          <input name="note" className="input" placeholder="Apa yang diperbaiki." />
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button disabled={pending} className="btn-primary ml-auto">
          {pending ? "Mengirim..." : "Kirim revisi"}
        </button>
      </div>
    </form>
  );
}

export function AuditButton({ reportId, sampled }: { reportId: string; sampled: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (sampled) return <span className="badge badge-neutral">Telah diaudit</span>;
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
      Tandai audit acak
    </button>
  );
}
