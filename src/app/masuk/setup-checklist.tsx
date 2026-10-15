import { AlertTriangle, CircleAlert, CheckCircle2, MinusCircle } from "lucide-react";
import { PeduliLogo, Credit } from "@/components/brand";
import type { EnvDiagnostics, EnvIssue } from "@/lib/env-check";

/** Ditampilkan bila konfigurasi wajib belum lengkap, menggantikan halaman masuk. */
export function SetupChecklist({ issues, diag }: { issues: EnvIssue[]; diag: EnvDiagnostics }) {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-xl p-7 anim-scale-in">
        <div className="flex justify-center"><PeduliLogo height={52} /></div>
        <h1 className="mt-5 text-center text-xl font-bold">Konfigurasi belum lengkap</h1>
        <p className="mt-1 text-center text-sm text-ink-500">
          Aplikasi dan basis data berjalan, tetapi beberapa variabel lingkungan wajib belum terbaca. Tambahkan di Vercel, Settings, Environment Variables, centang lingkungan <b>{diag.environment === "production" ? "Production" : diag.environment === "preview" ? "Preview" : diag.environment}</b>, lalu <b>Redeploy</b>. Variabel baru tidak terbaca sebelum deploy ulang.
        </p>
        <ul className="mt-5 space-y-2">
          {issues.map((i) => (
            <li key={i.key + i.message} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${i.level === "wajib" ? "border-red/20 bg-red/5" : "border-amber/30 bg-amber/10"}`}>
              {i.level === "wajib" ? <CircleAlert size={18} className="mt-0.5 shrink-0 text-red" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#8a6a0a]" />}
              <div>
                <div className="font-mono text-xs font-bold text-ink-800">{i.key} <span className="ml-1 rounded bg-ink-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase text-ink-500">{i.level}</span></div>
                <div className="mt-0.5 text-ink-700">{i.message}</div>
              </div>
            </li>
          ))}
        </ul>

        <details className="mt-5 rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-xs" open>
          <summary className="cursor-pointer font-semibold text-ink-700">Diagnosis deploy ini</summary>
          <dl className="mt-2 grid grid-cols-[110px_1fr] gap-y-1 text-ink-600">
            <dt>Lingkungan</dt><dd className="font-mono">{diag.environment}</dd>
            {diag.branch && (<><dt>Branch</dt><dd className="font-mono break-all">{diag.branch}</dd></>)}
            {diag.commit && (<><dt>Commit</dt><dd className="font-mono">{diag.commit}</dd></>)}
            {diag.host && (<><dt>Host deploy</dt><dd className="font-mono break-all">{diag.host}</dd></>)}
          </dl>
          <div className="mt-3 font-semibold text-ink-700">Variabel yang terbaca (nilai tidak ditampilkan)</div>
          <ul className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {diag.variables.map((v) => (
              <li key={v.name} className="flex items-center gap-1.5 font-mono">
                {v.present ? <CheckCircle2 size={13} className="text-brand-600" /> : <MinusCircle size={13} className="text-ink-300" />}
                <span className={v.present ? "text-ink-800" : "text-ink-400"}>{v.name}</span>
                {v.quoted && <span className="font-sans text-[10px] text-[#8a6a0a]">(berkutip, dibersihkan)</span>}
              </li>
            ))}
          </ul>
        </details>
        <p className="mt-4 text-xs text-ink-400">Rincian lengkap ada di README repository, bagian Produksi.</p>
        <Credit className="mt-5" />
      </div>
    </main>
  );
}
