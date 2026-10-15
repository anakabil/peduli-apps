import Image from "next/image";
import { redirect } from "next/navigation";
import { ShieldCheck, MapPin, Award, Lock, Users, Fingerprint } from "lucide-react";
import { signIn, isDemoMode } from "@/auth";
import { getCurrentUser } from "@/lib/session";
import { PeduliLogo, GysLogo, Credit } from "@/components/brand";
import { GoogleOneTap } from "./one-tap";
import { DemoLogin } from "./demo-login";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { APP_TAGLINE, COMPANY_NAME } from "@/lib/constants";
import { envBlocking, envIssues, envDiagnostics } from "@/lib/env-check";
import { googleClientId, googleClientSecret, oneTapClientId } from "@/lib/env";
import { SetupChecklist } from "./setup-checklist";

export const metadata = { title: "Masuk" };

const ERRORS: Record<string, string> = {
  domain: "Email Anda tidak termasuk domain yang diizinkan. Hubungi admin program.",
  OAuthSignin: "Gagal memulai proses masuk Google. Coba lagi.",
  OAuthCallbackError: "Proses masuk Google dibatalkan atau gagal.",
  Configuration: "Konfigurasi Google OAuth belum lengkap. Hubungi admin.",
  CredentialsSignin: "Akun tidak dikenali atau tidak diizinkan.",
  AccessDenied: "Akses ditolak.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; callbackUrl?: string }> }) {
  const blocking = envBlocking();
  if (blocking.length) return <SetupChecklist issues={envIssues()} diag={envDiagnostics()} />;
  // Arahkan ke beranda hanya bila pengguna sesi masih ada di basis data (hindari putaran pengalihan untuk sesi yatim)
  const current = await getCurrentUser().catch(() => null);
  if (current) redirect(current.status === "ACTIVE" ? "/beranda" : "/menunggu");
  const sp = await searchParams;
  const error = sp.error ? ERRORS[sp.error] ?? "Terjadi kendala saat masuk. Coba lagi." : null;
  const googleReady = !!googleClientId() && !!googleClientSecret();
  const oneTap = googleReady ? oneTapClientId() : "";
  const demo = isDemoMode();

  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Panel kiri: hero */}
      <section className="hero-pattern relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-60" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-2xl bg-white p-2.5 shadow-float">
            <GysLogo size={44} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white/90">{COMPANY_NAME}</div>
            <div className="text-xs text-white/60">Program pelaporan bahaya dan pengendalian risiko</div>
          </div>
        </div>
        <div className="relative max-w-lg anim-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
            <ShieldCheck size={14} /> Keselamatan dimulai dari kepedulian
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight">
            Lapor, verifikasi, putuskan, perbaiki, ukur.
          </h1>
          <p className="mt-4 text-white/75 leading-relaxed">
            PEDULI menyatukan UU No. 1 Tahun 1970, PP No. 50 Tahun 2012 tentang SMK3, dan ISO 45001:2018 dalam satu alur digital yang ringan bagi pelapor dan lengkap bagi pengambil keputusan.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: MapPin, t: "Geotagging otomatis", d: "Lokasi dan waktu terekam saat laporan dibuat." },
              { icon: Users, t: "Verifikasi berjenjang", d: "Superintendent memverifikasi, Manager memutuskan." },
              { icon: Award, t: "Poin dan reward", d: "Poin diberikan setelah laporan terverifikasi." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <f.icon size={20} className="text-brand-200" />
                <div className="mt-2 text-sm font-bold">{f.t}</div>
                <div className="mt-1 text-xs text-white/65 leading-snug">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/50">Developed by Nusa Safety</div>
      </section>

      {/* Panel kanan: formulir masuk */}
      <section className="flex min-h-dvh flex-col items-center justify-center px-5 py-10 lg:min-h-0">
        <div className="w-full max-w-sm anim-scale-in">
          <div className="mb-6 flex items-center justify-center lg:hidden">
            <div className="rounded-2xl bg-white p-2 shadow-card ring-1 ring-ink-100">
              <GysLogo size={40} />
            </div>
          </div>
          <div className="card p-7 md:p-8">
            <div className="flex justify-center">
              <PeduliLogo height={64} />
            </div>
            <p className="mt-3 text-center text-sm text-ink-500">{APP_TAGLINE}</p>
            <p className="mt-0.5 text-center text-xs font-semibold tracking-wide text-ink-400 uppercase">{COMPANY_NAME}</p>

            {error && <div className="mt-5 rounded-xl border border-red/20 bg-red/5 px-4 py-3 text-sm text-red">{error}</div>}

            <div className="mt-7 space-y-3">
              {googleReady ? (
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/beranda" });
                  }}
                >
                  <button className="btn-primary btn-lg w-full">
                    <GoogleIcon /> Masuk dengan akun Google
                  </button>
                </form>
              ) : (
                <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 p-4 text-xs text-ink-500">
                  <div className="flex items-center gap-2 font-semibold text-ink-700">
                    <Lock size={14} /> Google OAuth belum dikonfigurasi
                  </div>
                  Isi AUTH_GOOGLE_ID dan AUTH_GOOGLE_SECRET pada berkas .env untuk mengaktifkan masuk dengan Google. Lihat README.
                </div>
              )}
              {oneTap && <GoogleOneTap clientId={oneTap} />}
              {demo && <DemoLogin />}
            </div>

            <div className="mt-7 space-y-2.5 border-t border-ink-100 pt-5 text-xs text-ink-500">
              <div className="flex items-start gap-2">
                <Fingerprint size={14} className="mt-0.5 shrink-0 text-brand-600" />
                Satu akun untuk satu orang. Tampilan menu mengikuti peran yang ditetapkan admin.
              </div>
              <div className="flex items-start gap-2">
                <Lock size={14} className="mt-0.5 shrink-0 text-brand-600" />
                Setiap masuk dan keluar tercatat sebagai bahan audit keamanan.
              </div>
            </div>
          </div>
          <Credit className="mt-6" />
        </div>
        <InstallPrompt />
      </section>
      <Image src="/brand/peduli-mark.png" alt="" width={1} height={1} className="hidden" aria-hidden priority />
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.4 35.4 44 30.1 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
