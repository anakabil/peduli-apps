import Link from "next/link";
import { AlertTriangle, CheckCircle2, ShieldCheck, Gavel, Wrench, UserCheck, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageHeader, Card, CardHeader, CardBody, Badge } from "@/components/ui";

export const metadata = { title: "Matriks akuntabilitas" };

const OPEN = ["MENUNGGU_VERIFIKASI", "PERLU_REVISI", "MENUNGGU_KEPUTUSAN", "DALAM_PERBAIKAN", "MENUNGGU_PENUTUPAN"];

export default async function AkuntabilitasPage() {
  const user = await requireUser(["ADMIN", "MANAGER"]);
  const [settings, areas, users, openByArea] = await Promise.all([
    getSettings(),
    db.area.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, code: true, name: true, manager: { select: { id: true, name: true, status: true } } } }),
    db.user.findMany({
      where: { status: { in: ["ACTIVE", "PENDING"] } },
      select: { id: true, name: true, email: true, role: true, status: true, areaId: true, atasan: { select: { id: true, name: true, role: true, status: true } } },
      orderBy: { name: "asc" },
    }),
    db.report.groupBy({ by: ["areaId", "status"], where: { status: { in: OPEN } }, _count: { _all: true } }),
  ]);

  const active = users.filter((u) => u.status === "ACTIVE");
  const pending = users.filter((u) => u.status === "PENDING");
  const managers = active.filter((u) => u.role === "MANAGER");
  const supts = active.filter((u) => u.role === "SUPERINTENDENT");
  const validAtasan = (u: (typeof users)[number]) => !!u.atasan && u.atasan.role === "SUPERINTENDENT" && u.atasan.status === "ACTIVE";
  const pengawasList = active.filter((u) => u.role === "PENGAWAS");
  const pengawasNoAtasan = pengawasList.filter((u) => !validAtasan(u));
  const noArea = active.filter((u) => (u.role === "PENGAWAS" || u.role === "SUPERINTENDENT") && !u.areaId);
  const open = (areaId: string | null, statuses: string[]) => openByArea.filter((g) => g.areaId === areaId && statuses.includes(g.status)).reduce((s, g) => s + g._count._all, 0);
  const unmappedOpen = open(null, OPEN);

  const rows = areas.map((a) => {
    const areaSupts = supts.filter((s) => s.areaId === a.id);
    const areaPengawas = active.filter((u) => u.role === "PENGAWAS" && u.areaId === a.id);
    const managerOk = !!a.manager && a.manager.status === "ACTIVE";
    return {
      ...a,
      managerOk,
      areaSupts,
      areaPengawas,
      noAtasan: areaPengawas.filter((p) => !validAtasan(p)).length,
      verif: open(a.id, ["MENUNGGU_VERIFIKASI", "PERLU_REVISI"]),
      decide: open(a.id, ["MENUNGGU_KEPUTUSAN"]),
      fix: open(a.id, ["DALAM_PERBAIKAN", "MENUNGGU_PENUTUPAN"]),
    };
  });
  const issues = [
    ...rows.filter((r) => !r.managerOk).map((r) => `Area ${r.name} belum memiliki Manager aktif. Keputusan laporan area ini dikirim ke seluruh Manager.`),
    ...rows.filter((r) => r.areaSupts.length === 0).map((r) => `Area ${r.name} belum memiliki Superintendent. Verifikasi bergantung pada atasan pelapor.`),
    ...(pengawasNoAtasan.length ? [`${pengawasNoAtasan.length} Pengawas belum memiliki atasan Superintendent aktif. Laporan mereka dapat diverifikasi Superintendent mana pun.`] : []),
    ...(noArea.length ? [`${noArea.length} Pengawas atau Superintendent belum ditetapkan area kerjanya.`] : []),
    ...(managers.length === 0 ? ["Belum ada Manager aktif. Laporan tidak dapat diputuskan."] : []),
    ...(supts.length === 0 ? ["Belum ada Superintendent aktif. Laporan jalur A tidak dapat diverifikasi."] : []),
    ...(pending.length ? [`${pending.length} akun baru menunggu persetujuan dan penetapan peran.`] : []),
  ];
  const isAdmin = user.role === "ADMIN";

  const steps = [
    { icon: UserCheck, title: "Pelapor", body: "Pengawas mengirim laporan bahaya. Area kerja ditentukan dari koordinat GPS, cadangan dari area profil." },
    { icon: ShieldCheck, title: "Verifikasi (jalur A)", body: `Superintendent atasan pelapor, lalu Superintendent area, lalu seluruh Superintendent. Batas ${settings.verifyDeadlineDays} hari kerja.` },
    { icon: Gavel, title: "Keputusan", body: `Manager area laporan, bila kosong seluruh Manager aktif.${settings.managerPeerReview ? " Manager tidak memutuskan laporannya sendiri." : ""} Batas ${settings.decideDeadlineDays} hari kerja.${settings.escalateHighRisk ? " Risiko Tinggi dan Ekstrem dieskalasi langsung." : ""}` },
    { icon: Wrench, title: "Penanggung jawab", body: `Ditetapkan Manager saat menyetujui${settings.picByArea ? ", bawaannya Manager area" : ""}, lengkap dengan sumber daya dan target selesai.` },
    { icon: CheckCircle2, title: "Penutupan", body: "Manager pemutus atau Superintendent pemverifikasi memeriksa bukti perbaikan, lalu menutup laporan." },
  ];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Administrasi" title="Matriks akuntabilitas" description="Ke mana setiap temuan diarahkan, siapa yang memverifikasi, memutuskan, dan menindaklanjuti, per area kerja." />

      <Card>
        <CardHeader title="Alur penugasan temuan" subtitle="Aturan yang dijalankan sistem secara otomatis" />
        <CardBody className="pt-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-xl border border-ink-200 p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-brand-800"><s.icon size={16} /> {s.title}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-600">{s.body}</p>
                {i < steps.length - 1 && <ArrowRight size={14} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-ink-300 md:block" />}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-500">Jalur B (pelapor Superintendent, Manager, atau Direksi) langsung ke tahap keputusan. Batas waktu dan aturan dapat diubah di <Link href="/admin/pengaturan" className="font-semibold text-brand-700 underline">Pengaturan alur</Link>.</p>
        </CardBody>
      </Card>

      <Card className={issues.length ? "border-l-4 border-l-amber" : "border-l-4 border-l-brand-500"}>
        <CardHeader title={issues.length ? `${issues.length} hal perlu dilengkapi` : "Penugasan lengkap"} subtitle={issues.length ? "Lengkapi agar setiap temuan memiliki penanggung jawab yang jelas." : "Setiap area memiliki Manager dan Superintendent, setiap Pengawas memiliki atasan."} />
        {issues.length > 0 && (
          <CardBody className="pt-2">
            <ul className="space-y-1.5 text-sm">
              {issues.map((t) => (
                <li key={t} className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#8a6a0a]" /> {t}</li>
              ))}
            </ul>
            {isAdmin && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/admin/area" className="btn-secondary btn-sm min-h-11 md:min-h-0">Atur Manager area</Link>
                <Link href="/admin/pengguna" className="btn-secondary btn-sm min-h-11 md:min-h-0">Atur peran, area, dan atasan</Link>
              </div>
            )}
          </CardBody>
        )}
      </Card>

      <Card>
        <CardHeader title="Penanggung jawab per area" subtitle="Beban laporan terbuka dihitung dari seluruh waktu" />
        <CardBody className="pt-3">
          {/* Layar sempit: satu kartu per area */}
          <div className="space-y-2.5 md:hidden">
            {rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-ink-200 p-4">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-xs font-bold tracking-wide tabular-nums text-brand-700">{r.code}</span>
                  <span className="font-semibold text-ink-900">{r.name}</span>
                </div>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <div>
                    <dt className="text-xs text-ink-500">Manager (pemutus)</dt>
                    <dd className="mt-0.5 font-medium text-ink-800">{r.managerOk ? r.manager!.name : <Badge tone="warn">Belum ada, semua Manager</Badge>}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-500">Superintendent (verifikator)</dt>
                    <dd className="mt-0.5 font-medium text-ink-800">{r.areaSupts.length ? r.areaSupts.map((x) => x.name).join(", ") : <Badge tone="warn">Belum ada</Badge>}</dd>
                  </div>
                </dl>
                <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-ink-100 pt-3">
                  {[
                    ["Pengawas", r.areaPengawas.length],
                    ["Verifikasi", r.verif],
                    ["Keputusan", r.decide],
                    ["Perbaikan", r.fix],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="min-w-0">
                      <dt className="truncate text-xs text-ink-500">{k}</dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-ink-900">{v}</dd>
                    </div>
                  ))}
                </dl>
                {r.noAtasan > 0 && <p className="mt-2 text-xs font-semibold text-[#8a6a0a]">{r.noAtasan} Pengawas tanpa atasan</p>}
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Manager (pemutus)</th>
                  <th>Superintendent (verifikator)</th>
                  <th className="text-right">Pengawas</th>
                  <th className="text-right">Tunggu verifikasi</th>
                  <th className="text-right">Tunggu keputusan</th>
                  <th className="text-right">Perbaikan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><span className="text-xs font-bold tracking-wide tabular-nums text-brand-700">{r.code}</span> <span className="font-medium">{r.name}</span></td>
                    <td>{r.managerOk ? r.manager!.name : <Badge tone="warn">Belum ada, semua Manager</Badge>}</td>
                    <td>{r.areaSupts.length ? r.areaSupts.map((x) => x.name).join(", ") : <Badge tone="warn">Belum ada</Badge>}</td>
                    <td className="text-right tabular-nums">
                      {r.areaPengawas.length}
                      {r.noAtasan > 0 && <div className="whitespace-nowrap text-xs font-semibold text-[#8a6a0a]">{r.noAtasan} tanpa atasan</div>}
                    </td>
                    <td className="text-right tabular-nums">{r.verif}</td>
                    <td className="text-right tabular-nums">{r.decide}</td>
                    <td className="text-right tabular-nums">{r.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unmappedOpen > 0 && <p className="mt-3 text-xs text-ink-500">{unmappedOpen} laporan terbuka belum terpetakan ke area (GPS di luar radius dan pelapor tanpa area).</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Garis atasan Pengawas" subtitle="Atasan menerima tugas verifikasi laporan bawahannya" />
        <CardBody className="pt-3">
          {pengawasList.length === 0 ? (
            <p className="text-sm text-ink-500">Belum ada Pengawas aktif.</p>
          ) : (
            <>
              {/* Layar sempit: satu kartu per Pengawas */}
              <div className="space-y-2.5 md:hidden">
                {pengawasList.map((p) => (
                  <div key={p.id} className="rounded-xl border border-ink-200 p-4">
                    <div className="font-semibold text-ink-900">{p.name ?? "-"}</div>
                    <div className="truncate text-xs text-ink-500">{p.email}</div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      <div className="min-w-0">
                        <dt className="text-xs text-ink-500">Area</dt>
                        <dd className="mt-0.5 font-medium text-ink-800">{areas.find((a) => a.id === p.areaId)?.name ?? <Badge tone="warn">Belum diatur</Badge>}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-ink-500">Atasan</dt>
                        <dd className="mt-0.5 font-medium text-ink-800">{validAtasan(p) ? p.atasan!.name : <Badge tone="warn">Belum ada</Badge>}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="table">
                  <thead><tr><th>Pengawas</th><th>Area</th><th>Atasan (Superintendent)</th></tr></thead>
                  <tbody>
                    {pengawasList.map((p) => (
                      <tr key={p.id}>
                        <td><div className="font-medium">{p.name ?? "-"}</div><div className="text-xs text-ink-500">{p.email}</div></td>
                        <td>{areas.find((a) => a.id === p.areaId)?.name ?? <Badge tone="warn">Belum diatur</Badge>}</td>
                        <td>{validAtasan(p) ? p.atasan!.name : <Badge tone="warn">Belum ada atasan aktif</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
