import Link from "next/link";
import { ArrowLeft, Building2, Code2, ShieldCheck, Scale } from "lucide-react";
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

        <section className="card p-5 md:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-700">
            <Code2 size={15} /> PENGEMBANG
          </div>
          <div className="mt-2 text-lg font-bold text-ink-900">{DEVELOPER.brand}</div>
          <div className="text-sm text-ink-600">{DEVELOPER.company}</div>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{DEVELOPER.field}. {DEVELOPER.brand} merancang dan mengembangkan PEDULI, termasuk alur kerja, basis data, notifikasi, statistik, dan manual pengguna.</p>
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
          &copy; {year} {DEVELOPER.company} ({DEVELOPER.brand}). Dikembangkan untuk {COMPANY_NAME}.
        </p>
      </div>
    </main>
  );
}
