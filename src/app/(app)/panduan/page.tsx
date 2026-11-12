import { BookOpen, ShieldCheck, Gavel, Wrench, CheckCircle2, Award, Scale } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { PageHeader, Card, CardBody } from "@/components/ui";
import { ROLES, labels } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Panduan", "Guide") };
}

export default async function PanduanPage() {
  await requireUser();
  const { lang, tr } = await getTr();
  const L = labels(lang);
  const s = await getSettings();
  const steps = [
    {
      icon: BookOpen,
      t: tr("1. Lapor", "1. Report"),
      d: tr(
        "Foto dari kamera, lokasi GPS, dan waktu server terekam otomatis. Pelapor mengisi jenis dan sumber bahaya, risiko awal, uraian, dan usulan perbaikan.",
        "The camera photo, GPS location, and server time are recorded automatically. The reporter enters the hazard type and hazard source, initial risk level, description, and suggested action.",
      ),
    },
    {
      icon: ShieldCheck,
      t: tr("2. Verifikasi", "2. Verification"),
      d: tr(
        `Superintendent memeriksa laporan Pengawas: valid, revisi, atau tolak, dalam ${s.verifyDeadlineDays} hari kerja. Laporan dari peran lain melewati tahap ini.`,
        `The Superintendent reviews Supervisor reports (valid, revise, or reject) within ${s.verifyDeadlineDays} working days. Reports from other roles skip this stage.`,
      ),
    },
    {
      icon: Gavel,
      t: tr("3. Keputusan", "3. Decision"),
      d: tr(
        `Manager menyetujui atau menolak dalam ${s.decideDeadlineDays} hari kerja, menunjuk penanggung jawab, sumber daya, target, dan hierarki pengendalian.`,
        `The Manager approves or rejects within ${s.decideDeadlineDays} working days and assigns the person in charge (PIC), resources, target date, and hierarchy of controls.`,
      ),
    },
    {
      icon: Wrench,
      t: tr("4. Perbaikan", "4. Corrective action"),
      d: tr("Penanggung jawab memperbarui progres dan bukti foto, lalu mengajukan penutupan.", "The PIC updates progress and photo evidence, then requests closure."),
    },
    {
      icon: CheckCircle2,
      t: tr("5. Penutupan", "5. Closure"),
      d: tr("Manager memverifikasi hasil di lapangan, laporan ditutup, dan ketepatan waktu tercatat.", "The Manager verifies the result on site, the report is closed, and timeliness is recorded."),
    },
  ];
  const points = [
    [tr("Laporan bahaya valid (kondisi atau tindakan)", "Valid hazard report (condition or act)"), s.points.valid],
    [tr("Laporan nyaris celaka valid", "Valid near-miss report"), s.points.nearMiss],
    [tr("Bonus laporan risiko Tinggi atau Ekstrem", "High or Extreme risk report bonus"), `+${s.points.highRiskBonus}`],
    [tr("Bonus usulan perbaikan yang diterapkan", "Implemented suggested action bonus"), `+${s.points.suggestionBonus}`],
    [tr("Bonus konsisten, empat minggu berturut", "Consistency bonus, four consecutive weeks"), `+${s.points.streakBonus}`],
    [tr("Laporan ganda, ditolak, atau tidak benar", "Duplicate, rejected, or inaccurate report"), 0],
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow={tr("Panduan program", "Program guide")}
        title={tr("Cara kerja PEDULI", "How PEDULI works")}
        description={tr("Lapor, verifikasi, putuskan, perbaiki, ukur. Satu alur akuntabilitas untuk seluruh peran.", "Report, verify, decide, correct, measure. One accountability workflow for every role.")}
      />
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
            <div className="flex items-center gap-2"><Award size={18} className="text-gold" /><h3 className="font-bold">{tr("Sistem poin", "Points system")}</h3></div>
            <p className="mt-1 text-sm text-ink-500">{tr("Poin masuk setelah laporan diverifikasi, bukan saat dikirim.", "Points are credited once a report is verified, not when it is submitted.")}</p>
            <table className="table mt-3">
              <tbody>
                {points.map(([k, v]) => (
                  <tr key={String(k)}><td>{k}</td><td className="text-right font-bold text-brand-700">{v}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-ink-500">
              {tr(
                `Level Perunggu di bawah ${s.levels.perak} poin, Perak mulai ${s.levels.perak}, Emas mulai ${s.levels.emas} poin (akumulasi seluruh poin yang diperoleh).`,
                `Bronze level is below ${s.levels.perak} points, Silver starts at ${s.levels.perak}, and Gold starts at ${s.levels.emas} points (based on total points earned).`,
              )}
            </p>
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardBody>
            <div className="flex items-center gap-2"><Scale size={18} className="text-brand-600" /><h3 className="font-bold">{tr("Peran dan kewenangan", "Roles and authority")}</h3></div>
            <ul className="mt-3 space-y-2.5">
              {ROLES.map((r) => (
                <li key={r} className="text-sm"><span className="font-semibold text-ink-800">{L.ROLE_LABEL[r]}.</span> <span className="text-ink-600">{L.ROLE_DESC[r]}</span></li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
      <Card className="anim-fade-up">
        <CardBody>
          <h3 className="font-bold">{tr("Dasar acuan", "Regulatory basis")}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-600">
            <li>{tr("UU No. 1 Tahun 1970 tentang Keselamatan Kerja.", "Law No. 1 of 1970 on Occupational Safety.")}</li>
            <li>{tr("PP No. 50 Tahun 2012 tentang SMK3.", "Government Regulation No. 50 of 2012 on the OHS management system (SMK3).")}</li>
            <li>{tr("ISO 45001:2018 Sistem Manajemen K3.", "ISO 45001:2018 Occupational health and safety management systems.")}</li>
            <li>{tr("UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.", "Law No. 27 of 2022 on Personal Data Protection.")}</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
