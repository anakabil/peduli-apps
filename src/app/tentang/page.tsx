import Link from "next/link";
import { ArrowLeft, Building2, Code2, ShieldCheck, Scale, Eye, Target, Briefcase, MapPin, Globe, Mail, MessageCircle, AtSign, Network } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { PeduliLogo, GysLogo } from "@/components/brand";
import { APP_NAME, APP_TAGLINE, APP_VERSION, COMPANY_NAME, DEVELOPER } from "@/lib/constants";
import { LangSwitch } from "@/components/i18n/lang-switch";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Tentang PEDULI", "About PEDULI") };
}

/** Judul regulasi tetap berbahasa Indonesia; en adalah penjelasan bahasa Inggris */
const BASIS = [
  { id: "Undang-Undang Nomor 1 Tahun 1970 tentang Keselamatan Kerja", en: "Law No. 1 of 1970 on Work Safety" },
  { id: "Peraturan Pemerintah Nomor 50 Tahun 2012 tentang Penerapan SMK3", en: "Government Regulation No. 50 of 2012 on the Implementation of the OHS Management System (SMK3)" },
  { id: "SNI ISO 45001:2018 Sistem manajemen K3", en: "Indonesian National Standard adoption of ISO 45001:2018, Occupational health and safety management systems" },
  { id: "Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi", en: "Law No. 27 of 2022 on Personal Data Protection" },
];

export default async function AboutPage() {
  const user = await getCurrentUser().catch(() => null);
  const { lang, tr } = await getTr();
  const en = lang === "en";
  const back = user?.status === "ACTIVE" ? { href: "/beranda", label: tr("Kembali ke Beranda", "Back to Home") } : { href: "/masuk", label: tr("Kembali ke halaman masuk", "Back to sign-in") };
  const dev = {
    tagline: en ? DEVELOPER.en.tagline : DEVELOPER.tagline,
    profile: en ? DEVELOPER.en.profile : DEVELOPER.profile,
    vision: en ? DEVELOPER.en.vision : DEVELOPER.vision,
    mission: en ? DEVELOPER.en.mission : DEVELOPER.mission,
    services: en ? DEVELOPER.en.services : DEVELOPER.services,
    offices: DEVELOPER.offices.map((o, i) => ({ ...o, label: en ? DEVELOPER.en.offices[i] ?? o.label : o.label })),
  };
  const year = new Date().getFullYear();
  return (
    <main className="min-h-dvh px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl space-y-4 anim-fade-up">
        <div className="flex items-center justify-between gap-3">
          <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700">
            <ArrowLeft size={16} /> {back.label}
          </Link>
          <LangSwitch />
        </div>

        <section className="card p-6 text-center md:p-8">
          <div className="flex justify-center">
            <PeduliLogo height={56} />
          </div>
          <div className="mt-3 text-sm font-medium text-ink-700">{tr(APP_TAGLINE, "Hazard Reporting and Control")}</div>
          <div className="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{tr("Versi", "Version")} {APP_VERSION}</div>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-600">
            {tr(
              `${APP_NAME} adalah aplikasi untuk melaporkan bahaya di tempat kerja dan mengawal upaya pengendaliannya sampai tuntas, mulai dari laporan lapangan, verifikasi, keputusan, perbaikan, penutupan, sampai statistik bagi pimpinan.`,
              `${APP_NAME} is an application for reporting workplace hazards and seeing their control through to completion, from field reports, verification, decision, corrective action, and closure to statistics for management.`
            )}
          </p>
        </section>

        <section className="card overflow-hidden">
          <div className="bg-gradient-to-br from-ink-900 to-[#1f2a26] px-5 py-6 text-center md:px-6">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-white/60">
              <Code2 size={14} /> {tr("DIKEMBANGKAN OLEH", "DEVELOPED BY")}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/nusa-safety-long.png" alt={DEVELOPER.brand} width={640} height={96} className="mx-auto mt-3 h-auto w-56 md:w-64" />
            <p className="mx-auto mt-3 max-w-md text-sm italic text-white/75">&ldquo;{dev.tagline}&rdquo;</p>
          </div>
          <div className="space-y-5 p-5 md:p-6">
            <div>
              <div className="font-bold text-ink-900">{DEVELOPER.company}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{dev.profile}{" "}
                {tr(
                  `${DEVELOPER.brand} merancang dan mengembangkan PEDULI, mulai dari alur kerja, basis data, notifikasi, statistik, sampai manual pengguna.`,
                  `${DEVELOPER.brand} designed and developed PEDULI, from the workflow, database, notifications, and statistics to the user manual.`
                )}</p>
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
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-700"><Eye size={14} /> {tr("VISI", "VISION")}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{dev.vision}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-700"><Target size={14} /> {tr("MISI", "MISSION")}</div>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-sm leading-relaxed text-ink-700">
                  {dev.mission.map((m) => <li key={m}>{m}</li>)}
                </ol>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-700"><Briefcase size={14} /> {tr("LAYANAN", "SERVICES")}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {dev.services.map((sv) => <span key={sv} className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-700">{sv}</span>)}
              </div>
            </div>

            <div className="grid gap-4 border-t border-ink-100 pt-4 md:grid-cols-2">
              <div className="space-y-2.5">
                {dev.offices.map((o) => (
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
            <Building2 size={15} /> {tr("PENGGUNA", "USED BY")}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <GysLogo size={40} className="rounded" />
            <div>
              <div className="font-bold text-ink-900">{COMPANY_NAME}</div>
              <div className="text-sm text-ink-600">{tr("Program PEDULI dikelola oleh tim HSE sebagai Admin aplikasi.", "The PEDULI program is managed by the HSE team as the application Admin.")}</div>
            </div>
          </div>
        </section>

        <section className="card p-5 md:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-700">
            <Scale size={15} /> {tr("DASAR ACUAN", "REGULATORY BASIS")}
          </div>
          <ul className="mt-3 space-y-2">
            {BASIS.map((b) => (
              <li key={b.id} className="flex items-start gap-2 text-sm text-ink-700">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-600" />
                <div>
                  {b.id}
                  {en && <div className="mt-0.5 text-xs text-ink-500">{b.en}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p className="pt-2 text-center text-xs leading-relaxed text-ink-500">
          &copy; {year} {DEVELOPER.company}. {tr(`Dikembangkan untuk ${COMPANY_NAME}.`, `Developed for ${COMPANY_NAME}.`)}
        </p>
      </div>
    </main>
  );
}
