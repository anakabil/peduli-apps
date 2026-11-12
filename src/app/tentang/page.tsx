import Link from "next/link";
import { ArrowLeft, Building2, Code2, ShieldCheck, Scale, Eye, Target, Briefcase, MapPin, Globe, Mail, MessageCircle, AtSign, Network } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { PeduliLogo, GysLogo } from "@/components/brand";
import { APP_NAME, APP_TAGLINE, APP_VERSION, COMPANY_NAME, DEVELOPER } from "@/lib/constants";

export const metadata = { title: "Tentang PEDULI" };

const BASIS = [
  "Undang-Undang Nomor 1 Tahun 1970 tentang Keselamatan Kerja",
  "Peraturan Pemerintah Nomor 50 Tahun 2012 tentang Penerapan SMK3",
  "SNI ISO 45001:2018 Sistem manajemen K3",
  "Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi",
];

export default async function AboutPage() {
  const user = await getCurrentUser().catch(() => null);
  const back = user?.status === "ACTIVE" ? { href: "/beranda", label: "Kembali ke Beranda" } : { href: "/masuk", label: "Kembali ke halaman masuk" };
  const year = new Date().getFullYear();
  return (
    <main className="min-h-dvh px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl space-y-4 anim-fade-up">
        <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700">
          <ArrowLeft size={16} /> {back.label}
        </Link>

        <section className="card p-6 text-center md:p-8">
          <div className="flex justify-center">
            <PeduliLogo height={56} />
          </div>
          <div className="mt-3 text-sm font-medium text-ink-700">{APP_TAGLINE}</div>
          <div className="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Versi {APP_VERSION}</div>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-600">
            {APP_NAME} adalah aplikasi untuk melaporkan bahaya di tempat kerja dan mengawal upaya pengendaliannya sampai tuntas, mulai dari laporan lapangan, verifikasi, keputusan, perbaikan, penutupan, sampai statistik bagi pimpinan.
          </p>
        </section>

        <section className="card overflow-hidden">
          <div className="bg-gradient-to-br from-ink-900 to-[#1f2a26] px-5 py-6 text-center md:px-6">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-white/60">
              <Code2 size={14} /> DIKEMBANGKAN OLEH
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/nusa-safety-long.png" alt={DEVELOPER.brand} width={640} height={96} className="mx-auto mt-3 h-auto w-56 md:w-64" />
            <p className="mx-auto mt-3 max-w-md text-sm italic text-white/75">&ldquo;{DEVELOPER.tagline}&rdquo;</p>
          </div>
          <div className="space-y-5 p-5 md:p-6">
            <div>
              <div className="font-bold text-ink-900">{DEVELOPER.company}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{DEVELOPER.profile} {DEVELOPER.brand} merancang dan mengembangkan PEDULI, mulai dari alur kerja, basis data, notifikasi, statistik, sampai manual pengguna.</p>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-ink-50 px-3.5 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/nusa-safety-mark.png" alt="" aria-hidden width={36} height={36} className="h-9 w-9 rounded-md" />
                <div className="text-sm">
                  <div className="font-semibold text-ink-900">{DEVELOPER.founder.name}</div>
                  <div className="text-xs text-ink-500">{DEVELOPER.founder.title}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-700"><Eye size={14} /> VISI</div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{DEVELOPER.vision}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-700"><Target size={14} /> MISI</div>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-sm leading-relaxed text-ink-700">
                  {DEVELOPER.mission.map((m) => <li key={m}>{m}</li>)}
                </ol>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-700"><Briefcase size={14} /> LAYANAN</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DEVELOPER.services.map((sv) => <span key={sv} className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-700">{sv}</span>)}
              </div>
            </div>

            <div className="grid gap-4 border-t border-ink-100 pt-4 md:grid-cols-2">
              <div className="space-y-2.5">
                {DEVELOPER.offices.map((o) => (
                  <div key={o.label} className="flex items-start gap-2 text-sm">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-brand-600" />
                    <div><div className="font-semibold text-ink-800">{o.label}</div><div className="text-ink-600">{o.address}</div></div>
                  </div>
                ))}
              </div>
              <ul className="space-y-2 text-sm">
                <li><a href={DEVELOPER.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ink-700 hover:text-brand-700"><Globe size={15} className="text-brand-600" /> nusasafety.co.id</a></li>
                <li><a href={`mailto:${DEVELOPER.email}`} className="flex items-center gap-2 text-ink-700 hover:text-brand-700"><Mail size={15} className="text-brand-600" /> {DEVELOPER.email}</a></li>
                <li><a href={DEVELOPER.whatsapp.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ink-700 hover:text-brand-700"><MessageCircle size={15} className="text-brand-600" /> WhatsApp {DEVELOPER.whatsapp.label}</a></li>
                <li className="flex flex-wrap gap-x-4 gap-y-2">
                  <a href={DEVELOPER.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ink-700 hover:text-brand-700"><AtSign size={15} className="text-brand-600" /> @nusasafety</a>
                  <a href={DEVELOPER.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ink-700 hover:text-brand-700"><Network size={15} className="text-brand-600" /> LinkedIn</a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="card p-5 md:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-700">
            <Building2 size={15} /> PENGGUNA
          </div>
          <div className="mt-3 flex items-center gap-3">
            <GysLogo size={40} className="rounded" />
            <div>
              <div className="font-bold text-ink-900">{COMPANY_NAME}</div>
              <div className="text-sm text-ink-600">Program PEDULI dikelola oleh tim HSE sebagai Admin aplikasi.</div>
            </div>
          </div>
        </section>

        <section className="card p-5 md:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-700">
            <Scale size={15} /> DASAR ACUAN
          </div>
          <ul className="mt-3 space-y-2">
            {BASIS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-ink-700">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-600" />
                {b}
              </li>
            ))}
          </ul>
        </section>

        <p className="pt-2 text-center text-xs leading-relaxed text-ink-500">
          &copy; {year} {DEVELOPER.company}. Dikembangkan untuk {COMPANY_NAME}.
        </p>
      </div>
    </main>
  );
}
