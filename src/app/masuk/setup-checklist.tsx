import { AlertTriangle, CircleAlert } from "lucide-react";
import { PeduliLogo, Credit } from "@/components/brand";
import type { EnvIssue } from "@/lib/env-check";

/** Ditampilkan bila konfigurasi wajib belum lengkap, menggantikan halaman masuk. */
export function SetupChecklist({ issues }: { issues: EnvIssue[] }) {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-xl p-7 anim-scale-in">
        <div className="flex justify-center"><PeduliLogo height={52} /></div>
        <h1 className="mt-5 text-center text-xl font-bold">Konfigurasi belum lengkap</h1>
        <p className="mt-1 text-center text-sm text-ink-500">Aplikasi berjalan, tetapi beberapa variabel lingkungan wajib belum diatur. Lengkapi di pengaturan proyek Vercel (Settings, Environment Variables), lalu deploy ulang.</p>
        <ul className="mt-5 space-y-2">
          {issues.map((i) => (
            <li key={i.key} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${i.level === "wajib" ? "border-red/20 bg-red/5" : "border-amber/30 bg-amber/10"}`}>
              {i.level === "wajib" ? <CircleAlert size={18} className="mt-0.5 shrink-0 text-red" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#8a6a0a]" />}
              <div>
                <div className="font-mono text-xs font-bold text-ink-800">{i.key} <span className="ml-1 rounded bg-ink-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase text-ink-500">{i.level}</span></div>
                <div className="mt-0.5 text-ink-700">{i.message}</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-ink-400">Rincian lengkap ada di README repository, bagian Produksi.</p>
        <Credit className="mt-5" />
      </div>
    </main>
  );
}
