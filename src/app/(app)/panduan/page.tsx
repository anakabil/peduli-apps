import { BookOpen, ShieldCheck, Gavel, Wrench, CheckCircle2, Award, Scale } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { PageHeader, Card, CardBody } from "@/components/ui";
import { ROLES, ROLE_LABEL, ROLE_DESC } from "@/lib/constants";

export const metadata = { title: "Panduan" };

export default async function PanduanPage() {
  await requireUser();
  const s = await getSettings();
  const steps = [
    { icon: BookOpen, t: "1. Lapor", d: "Foto dari kamera, lokasi GPS, dan waktu server terekam otomatis. Pelapor mengisi kategori, risiko awal, uraian, dan usulan perbaikan." },
    { icon: ShieldCheck, t: "2. Verifikasi", d: `Superintendent memeriksa laporan Pengawas: valid, revisi, atau tolak, dalam ${s.verifyDeadlineDays} hari kerja. Laporan dari peran lain melewati tahap ini.` },
    { icon: Gavel, t: "3. Keputusan", d: `Manager menyetujui atau menolak dalam ${s.decideDeadlineDays} hari kerja, menunjuk penanggung jawab, sumber daya, target, dan hierarki pengendalian.` },
    { icon: Wrench, t: "4. Perbaikan", d: "Penanggung jawab memperbarui progres dan bukti foto, lalu mengajukan penutupan." },
    { icon: CheckCircle2, t: "5. Penutupan", d: "Manager memverifikasi hasil di lapangan, laporan ditutup, dan ketepatan waktu tercatat." },
  ];
  const points = [
    ["Laporan bahaya valid (kondisi atau tindakan)", s.points.valid],
    ["Laporan nyaris celaka valid", s.points.nearMiss],
    ["Bonus laporan risiko Tinggi atau Ekstrem", `+${s.points.highRiskBonus}`],
    ["Bonus usulan perbaikan yang diterapkan", `+${s.points.suggestionBonus}`],
    ["Bonus konsisten, empat minggu berturut", `+${s.points.streakBonus}`],
    ["Laporan ganda, ditolak, atau tidak benar", 0],
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow="Panduan program" title="Cara kerja PEDULI" description="Lapor, verifikasi, putuskan, perbaiki, ukur. Satu alur akuntabilitas untuk seluruh peran." />
      <div className="grid gap-3 md:grid-cols-5 stagger">
        {steps.map((st) => (
          <Card key={st.t} className="p-4">
            <st.icon size={22} className="text-brand-600" />
            <div className="mt-2 font-bold">{st.t}</div>
            <p className="mt-1 text-xs text-ink-600 leading-relaxed">{st.d}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="anim-fade-up">
          <CardBody>
            <div className="flex items-center gap-2"><Award size={18} className="text-gold" /><h3 className="font-bold">Sistem poin</h3></div>
            <p className="mt-1 text-sm text-ink-500">Poin masuk setelah laporan diverifikasi, bukan saat dikirim.</p>
            <table className="table mt-3">
              <tbody>
                {points.map(([k, v]) => (
                  <tr key={String(k)}><td>{k}</td><td className="text-right font-bold text-brand-700">{v}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-ink-500">Level Perunggu di bawah {s.levels.perak} poin, Perak mulai {s.levels.perak}, Emas mulai {s.levels.emas} poin (akumulasi seluruh poin yang diperoleh).</p>
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardBody>
            <div className="flex items-center gap-2"><Scale size={18} className="text-brand-600" /><h3 className="font-bold">Peran dan kewenangan</h3></div>
            <ul className="mt-3 space-y-2.5">
              {ROLES.map((r) => (
                <li key={r} className="text-sm"><span className="font-semibold text-ink-800">{ROLE_LABEL[r]}.</span> <span className="text-ink-600">{ROLE_DESC[r]}</span></li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
      <Card className="anim-fade-up">
        <CardBody>
          <h3 className="font-bold">Dasar acuan</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-600">
            <li>Undang-Undang Nomor 1 Tahun 1970 tentang Keselamatan Kerja: hak dan kewajiban atas bahaya kerja.</li>
            <li>Peraturan Pemerintah Nomor 50 Tahun 2012 tentang Penerapan SMK3: identifikasi bahaya, penilaian, dan pengendalian risiko.</li>
            <li>ISO 45001:2018: partisipasi pekerja (5.4), identifikasi bahaya (6.1.2), hierarki pengendalian (8.1.2), insiden dan tindakan korektif (10.2).</li>
            <li>Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi: lokasi hanya diambil saat laporan dibuat.</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
