"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircleQuestion, Send, Forward, Ban, Eye, EyeOff } from "lucide-react";
import { askAction, forwardAction, rejectConsultAction, answerAction, publishAction } from "./actions";
import { useFormAction, Msg } from "../admin/feedback";
import { CONSULT_TOPICS, CONSULT_TOPIC_LABEL, CONSULT_REJECT_REASONS, CONSULT_REJECT_LABEL } from "@/lib/constants";
import { cn } from "@/lib/format";

/** Formulir pertanyaan konsultasi; di Beranda tampil ringkas sebagai kolom ajakan lalu terbuka saat disentuh */
export function AskForm({ prompt = false }: { prompt?: boolean }) {
  const [open, setOpen] = useState(!prompt);
  const [sent, setSent] = useState(false);
  const { pending, res, action } = useFormAction(async (fd) => {
    const r = await askAction(fd);
    if (r.ok) setSent(true);
    return r;
  });

  if (prompt && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="card card-hover flex w-full items-center gap-3 p-4 text-left anim-fade-up">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
          <MessageCircleQuestion size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wider text-brand-700">Layanan konsultasi K3</span>
          <span className="mt-0.5 block rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-500">Butuh konsultasi terkait SMK3? Tulis di sini...</span>
        </span>
      </button>
    );
  }

  if (sent) {
    return (
      <div className="card p-5 anim-fade-up">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <MessageCircleQuestion size={20} />
          </span>
          <div className="min-w-0">
            <div className="font-bold text-ink-900">Pertanyaan terkirim</div>
            <p className="mt-0.5 text-sm text-ink-600">Tim HSE akan meneruskannya kepada pengurus. Jawaban akan dikirim melalui notifikasi.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/konsultasi" className="btn-secondary btn-sm min-h-11 md:min-h-0">Lihat pertanyaan saya</Link>
              <button type="button" onClick={() => setSent(false)} className="btn-ghost btn-sm min-h-11 md:min-h-0">Tulis pertanyaan lain</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className={cn("card p-5", prompt && "anim-fade-up")}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-700 text-white"><MessageCircleQuestion size={18} /></span>
        <div>
          <div className="font-bold text-ink-900">Konsultasi K3 kepada pengurus</div>
          <div className="text-xs text-ink-500">Disaring tim HSE, dijawab langsung oleh pengurus.</div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <label className="label" htmlFor="topic">Topik</label>
          <select id="topic" name="topic" className="input" defaultValue="">
            <option value="" disabled>Pilih topik</option>
            {CONSULT_TOPICS.map((t) => <option key={t} value={t}>{CONSULT_TOPIC_LABEL[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="question">Pertanyaan</label>
          <textarea id="question" name="question" rows={4} className="input" autoFocus={prompt} placeholder="Butuh konsultasi terkait SMK3? Tulis di sini..." maxLength={2000} />
        </div>
        <label className="flex min-h-11 cursor-pointer items-start gap-2.5 text-sm text-ink-700">
          <input type="checkbox" name="anonymous" className="mt-0.5 size-5 shrink-0 accent-[var(--brand-600)]" />
          <span>
            Rahasiakan nama saya dari pengurus
            <span className="block text-xs text-ink-500">Tim HSE tetap mengetahui pemohon untuk keperluan tindak lanjut.</span>
          </span>
        </label>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Msg res={res} />
        <div className="flex gap-2 sm:ml-auto">
          {prompt && <button type="button" onClick={() => setOpen(false)} className="btn-ghost min-h-11 md:min-h-0">Batal</button>}
          <button disabled={pending} className="btn-primary min-h-11 md:min-h-0"><Send size={16} /> {pending ? "Mengirim..." : "Kirim pertanyaan"}</button>
        </div>
      </div>
    </form>
  );
}

/** Penyaringan oleh tim HSE: teruskan kepada pengurus atau tidak diteruskan dengan alasan */
export function ScreenForm({ id, pengurus }: { id: string; pengurus: Array<{ id: string; name: string; jabatan: string | null }> }) {
  const [mode, setMode] = useState<"forward" | "reject">("forward");
  const fwd = useFormAction((fd) => forwardAction(id, fd));
  const rej = useFormAction((fd) => rejectConsultAction(id, fd));
  return (
    <div className="mt-3 rounded-xl border border-ink-200 bg-ink-50/60 p-3">
      <div className="mb-3 grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Tindakan penyaringan">
        <button type="button" role="radio" aria-checked={mode === "forward"} onClick={() => setMode("forward")} className={cn("chip min-h-11 justify-center md:min-h-0", mode === "forward" && "chip-active")}><Forward size={14} /> Teruskan</button>
        <button type="button" role="radio" aria-checked={mode === "reject"} onClick={() => setMode("reject")} className={cn("chip min-h-11 justify-center md:min-h-0", mode === "reject" && "chip-active")}><Ban size={14} /> Tidak diteruskan</button>
      </div>
      {mode === "forward" ? (
        <form action={fwd.action} className="space-y-2.5">
          <div>
            <label className="label" htmlFor={`a-${id}`}>Pengurus penjawab</label>
            <select id={`a-${id}`} name="assigneeId" className="input" defaultValue="">
              <option value="" disabled>Pilih pengurus</option>
              {pengurus.map((p) => <option key={p.id} value={p.id}>{p.name}{p.jabatan ? `, ${p.jabatan}` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`n-${id}`}>Catatan untuk pengurus</label>
            <textarea id={`n-${id}`} name="screenNote" rows={2} className="input" placeholder="Konteks atau data pendukung bila perlu." />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Msg res={fwd.res} />
            <button disabled={fwd.pending} className="btn-primary min-h-11 sm:ml-auto md:min-h-0"><Forward size={16} /> {fwd.pending ? "Meneruskan..." : "Teruskan"}</button>
          </div>
        </form>
      ) : (
        <form action={rej.action} className="space-y-2.5">
          <div>
            <label className="label" htmlFor={`r-${id}`}>Alasan</label>
            <select id={`r-${id}`} name="rejectReason" className="input" defaultValue="">
              <option value="" disabled>Pilih alasan</option>
              {CONSULT_REJECT_REASONS.map((r) => <option key={r} value={r}>{CONSULT_REJECT_LABEL[r]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`rn-${id}`}>Penjelasan untuk pemohon</label>
            <textarea id={`rn-${id}`} name="rejectNote" rows={2} className="input" placeholder="Arahkan pemohon ke saluran yang tepat." />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Msg res={rej.res} />
            <button disabled={rej.pending} className="btn-secondary min-h-11 sm:ml-auto md:min-h-0"><Ban size={16} /> {rej.pending ? "Menyimpan..." : "Tidak diteruskan"}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function AnswerForm({ id }: { id: string }) {
  const { pending, res, action } = useFormAction((fd) => answerAction(id, fd));
  return (
    <form action={action} className="mt-3 space-y-2.5">
      <label className="label" htmlFor={`ans-${id}`}>Jawaban Anda</label>
      <textarea id={`ans-${id}`} name="answer" rows={4} className="input" placeholder="Jawaban dan arahan tindak lanjut." maxLength={4000} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Msg res={res} />
        <button disabled={pending} className="btn-primary min-h-11 sm:ml-auto md:min-h-0"><Send size={16} /> {pending ? "Mengirim..." : "Kirim jawaban"}</button>
      </div>
    </form>
  );
}

export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const { pending, res, action } = useFormAction(() => publishAction(id, !published));
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <button disabled={pending} className={cn("btn-sm min-h-11 md:min-h-0", published ? "btn-ghost" : "btn-secondary")}>
        {published ? <EyeOff size={14} /> : <Eye size={14} />} {published ? "Sembunyikan dari Tanya jawab" : "Tampilkan di Tanya jawab"}
      </button>
      <Msg res={res} />
    </form>
  );
}
