"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, XCircle, ThumbsUp, ThumbsDown, Wrench, Flag, Camera, Send, ShieldCheck, Sparkles } from "lucide-react";
import { verifyAction, decideAction, progressAction, closeAction, resubmitAction, auditSampleAction, type ActionResult } from "./actions";
import { CONTROLS, CONTROL_LABEL, CATEGORIES, CATEGORY_LABEL, RISKS, RISK_LABEL } from "@/lib/constants";
import { Field } from "@/components/ui";

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
      <ul className="mt-3 space-y-1 text-sm text-ink-600">
        <li>Foto sesuai lokasi dan waktu</li>
        <li>Uraian bahaya jelas dan lengkap</li>
        <li>Bukan laporan ganda</li>
      </ul>
      <input type="hidden" name="result" value={result} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" onClick={() => setResult("VALID")} className={`btn ${result === "VALID" ? "btn-success" : "btn-secondary"}`}>
          <CheckCircle2 size={16} /> Valid
        </button>
        <button type="button" onClick={() => setResult("REVISI")} className={`btn ${result === "REVISI" ? "btn-warn" : "btn-secondary"}`}>
          <RotateCcw size={16} /> Revisi
        </button>
        <button type="button" onClick={() => setResult("TOLAK")} className={`btn ${result === "TOLAK" ? "btn-danger" : "btn-secondary"}`}>
          <XCircle size={16} /> Tolak
        </button>
      </div>
      <div className="mt-4">
        <Field label={result === "VALID" ? "Catatan (opsional)" : "Catatan untuk pelapor"} required={result !== "VALID"}>
          <textarea name="note" className="input min-h-20" placeholder={result === "TOLAK" ? "Contoh: laporan ganda dengan PDL-..., atau foto tidak sesuai." : "Tulis catatan."} />
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
        <button type="button" onClick={() => setResult("SETUJU")} className={`btn ${result === "SETUJU" ? "btn-success" : "btn-secondary"}`}>
          <ThumbsUp size={16} /> Setujui
        </button>
        <button type="button" onClick={() => setResult("TOLAK")} className={`btn ${result === "TOLAK" ? "btn-danger" : "btn-secondary"}`}>
          <ThumbsDown size={16} /> Tolak
        </button>
      </div>

      {result === "SETUJU" ? (
        <div className="mt-4 space-y-4 anim-fade-in">
          <Field label="Penanggung jawab" required help="Pilih pengguna terdaftar atau tulis jabatan/nama bila belum terdaftar.">
            <select name="picId" className="input" defaultValue={defaultPicId ?? ""}>
              <option value="">Pilih dari daftar pengguna</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.jabatan ?? c.role})
                </option>
              ))}
            </select>
            <input name="picName" className="input mt-2" placeholder="Atau tulis jabatan/nama penanggung jawab" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          <Field label="Hierarki pengendalian (ISO 45001:2018 klausul 8.1.2)" required>
            <div className="flex flex-wrap gap-2">
              {CONTROLS.map((c) => (
                <button key={c} type="button" onClick={() => setControl(c)} className={`chip ${control === c ? "chip-active" : ""}`}>
                  {CONTROL_LABEL[c]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Catatan keputusan (opsional)">
            <textarea name="note" className="input min-h-16" />
          </Field>
        </div>
      ) : (
        <div className="mt-4 space-y-4 anim-fade-in">
          <Field label="Alasan penolakan" required>
            <select name="rejectReason" className="input">
              <option value="TIDAK_PERLU_TINDAKAN">Tidak memerlukan tindakan (poin tetap diberikan)</option>
              <option value="GANDA">Laporan ganda (poin dibatalkan)</option>
              <option value="TIDAK_BENAR">Laporan tidak benar (poin dibatalkan)</option>
            </select>
          </Field>
          <Field label="Penjelasan untuk pelapor" required>
            <textarea name="note" className="input min-h-20" required />
          </Field>
        </div>
      )}
      {hasSuggestion && result === "SETUJU" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
          <Sparkles size={13} className="text-gold" /> Laporan ini memuat usulan perbaikan. Tandai sebagai diterapkan saat penutupan untuk memberikan bonus poin.
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
        <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} className="accent-[var(--brand-600)]" />
        Perbaikan selesai, ajukan penutupan
      </label>
      <div className="mt-4">
        <Field label="Catatan" required>
          <textarea name="note" className="input min-h-16" placeholder="Apa yang sudah dikerjakan." required />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Foto bukti perbaikan (opsional)">
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
          <input type="checkbox" name="suggestionApplied" className="accent-[var(--brand-600)]" />
          Usulan perbaikan dari pelapor diterapkan (bonus poin)
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
