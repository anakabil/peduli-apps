import Link from "next/link";
import { AlertTriangle, CheckCircle2, ShieldCheck, Gavel, Wrench, UserCheck, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageHeader, Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Matriks akuntabilitas", "Accountability matrix") };
}

const OPEN = ["MENUNGGU_VERIFIKASI", "PERLU_REVISI", "MENUNGGU_KEPUTUSAN", "DALAM_PERBAIKAN", "MENUNGGU_PENUTUPAN"];

export default async function AkuntabilitasPage() {
  const user = await requireUser(["ADMIN", "MANAGER"]);
  const { tr } = await getTr();
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
    ...rows.filter((r) => !r.managerOk).map((r) => tr(`Area ${r.name} belum memiliki Manager aktif. Keputusan laporan area ini dikirim ke seluruh Manager.`, `Area ${r.name} has no active Manager. Decisions on reports from this area are sent to all Managers.`)),
    ...rows.filter((r) => r.areaSupts.length === 0).map((r) => tr(`Area ${r.name} belum memiliki Superintendent. Verifikasi bergantung pada atasan pelapor.`, `Area ${r.name} has no Superintendent. Verification relies on the reporter's superior.`)),
    ...(pengawasNoAtasan.length
      ? [tr(`${pengawasNoAtasan.length} Pengawas belum memiliki atasan Superintendent aktif. Laporan mereka dapat diverifikasi Superintendent mana pun.`, `${pengawasNoAtasan.length} Supervisor${pengawasNoAtasan.length === 1 ? " has" : "s have"} no active Superintendent as superior. Their reports can be verified by any Superintendent.`)]
      : []),
    ...(noArea.length ? [tr(`${noArea.length} Pengawas atau Superintendent belum ditetapkan area kerjanya.`, `${noArea.length} Supervisor${noArea.length === 1 ? " or Superintendent has" : "s or Superintendents have"} no work area assigned.`)] : []),
    ...(managers.length === 0 ? [tr("Belum ada Manager aktif. Laporan tidak dapat diputuskan.", "There is no active Manager. Reports cannot be decided.")] : []),
    ...(supts.length === 0 ? [tr("Belum ada Superintendent aktif. Laporan jalur A tidak dapat diverifikasi.", "There is no active Superintendent. Path A reports cannot be verified.")] : []),
    ...(pending.length ? [tr(`${pending.length} akun baru menunggu persetujuan dan penetapan peran.`, `${pending.length} new account${pending.length === 1 ? " is" : "s are"} awaiting approval and role assignment.`)] : []),
  ];
  const isAdmin = user.role === "ADMIN";

  const steps = [
    { icon: UserCheck, title: tr("Pelapor", "Reporter"), body: tr("Pengawas mengirim laporan bahaya. Area kerja ditentukan dari koordinat GPS, cadangan dari area profil.", "The Supervisor submits a hazard report. The work area is determined from GPS coordinates, with the profile area as a fallback.") },
    {
      icon: ShieldCheck,
      title: tr("Verifikasi (jalur A)", "Verification (path A)"),
      body: tr(
        `Superintendent atasan pelapor, lalu Superintendent area, lalu seluruh Superintendent. Batas ${settings.verifyDeadlineDays} hari kerja.`,
        `The reporter's superior Superintendent, then the area Superintendent, then all Superintendents. Deadline: ${settings.verifyDeadlineDays} working day${settings.verifyDeadlineDays === 1 ? "" : "s"}.`,
      ),
    },
    {
      icon: Gavel,
      title: tr("Keputusan", "Decision"),
      body: tr(
        `Manager area laporan, bila kosong seluruh Manager aktif.${settings.managerPeerReview ? " Manager tidak memutuskan laporannya sendiri." : ""} Batas ${settings.decideDeadlineDays} hari kerja.${settings.escalateHighRisk ? " Risiko Tinggi dan Ekstrem dieskalasi langsung." : ""}`,
        `The Manager of the report's area, or all active Managers if none is set.${settings.managerPeerReview ? " Managers do not decide on their own reports." : ""} Deadline: ${settings.decideDeadlineDays} working day${settings.decideDeadlineDays === 1 ? "" : "s"}.${settings.escalateHighRisk ? " High and Extreme risks are escalated immediately." : ""}`,
      ),
    },
    {
      icon: Wrench,
      title: tr("Penanggung jawab", "Person in charge (PIC)"),
      body: tr(
        `Ditetapkan Manager saat menyetujui${settings.picByArea ? ", bawaannya Manager area" : ""}, lengkap dengan sumber daya dan target selesai.`,
        `Assigned by the Manager on approval${settings.picByArea ? ", defaulting to the area Manager" : ""}, together with resources and a target date.`,
      ),
    },
    { icon: CheckCircle2, title: tr("Penutupan", "Closure"), body: tr("Manager pemutus atau Superintendent pemverifikasi memeriksa bukti perbaikan, lalu menutup laporan.", "The deciding Manager or the verifying Superintendent reviews the evidence of corrective action, then closes the report.") },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={tr("Administrasi", "Administration")}
        title={tr("Matriks akuntabilitas", "Accountability matrix")}
        description={tr("Ke mana setiap temuan diarahkan, siapa yang memverifikasi, memutuskan, dan menindaklanjuti, per area kerja.", "Where each finding is routed, and who verifies, decides, and follows up on it, by work area.")}
      />

      <Card>
        <CardHeader title={tr("Alur penugasan temuan", "Finding assignment flow")} subtitle={tr("Aturan yang dijalankan sistem secara otomatis", "Rules the system applies automatically")} />
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
          <p className="mt-3 text-xs text-ink-500">
            {tr("Jalur B (pelapor Superintendent, Manager, atau Direksi) langsung ke tahap keputusan. Batas waktu dan aturan dapat diubah di ", "Path B (reports by a Superintendent, Manager, or Director) goes straight to the decision stage. Deadlines and rules can be changed in ")}
            <Link href="/admin/pengaturan" className="font-semibold text-brand-700 underline">{tr("Pengaturan alur", "Workflow settings")}</Link>.
          </p>
        </CardBody>
      </Card>

      <Card className={issues.length ? "border-l-4 border-l-amber" : "border-l-4 border-l-brand-500"}>
        <CardHeader
          title={issues.length ? tr(`${issues.length} hal perlu dilengkapi`, `${issues.length} item${issues.length === 1 ? "" : "s"} to complete`) : tr("Penugasan lengkap", "Assignments complete")}
          subtitle={issues.length ? tr("Lengkapi agar setiap temuan memiliki penanggung jawab yang jelas.", "Complete these so every finding has a clear person in charge.") : tr("Setiap area memiliki Manager dan Superintendent, setiap Pengawas memiliki atasan.", "Every area has a Manager and a Superintendent, and every Supervisor has a superior.")}
        />
        {issues.length > 0 && (
          <CardBody className="pt-2">
            <ul className="space-y-1.5 text-sm">
              {issues.map((t) => (
                <li key={t} className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#8a6a0a]" /> {t}</li>
              ))}
            </ul>
            {isAdmin && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/admin/area" className="btn-secondary btn-sm min-h-11 md:min-h-0">{tr("Atur Manager area", "Set area Managers")}</Link>
                <Link href="/admin/pengguna" className="btn-secondary btn-sm min-h-11 md:min-h-0">{tr("Atur peran, area, dan atasan", "Set roles, areas, and superiors")}</Link>
              </div>
            )}
          </CardBody>
        )}
      </Card>

      <Card>
        <CardHeader title={tr("Penanggung jawab per area", "Persons in charge by area")} subtitle={tr("Beban laporan terbuka dihitung dari seluruh waktu", "Open report workload is counted across all time")} />
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
                    <dt className="text-xs text-ink-500">{tr("Manager (pemutus)", "Manager (decides)")}</dt>
                    <dd className="mt-0.5 font-medium text-ink-800">{r.managerOk ? r.manager!.name : <Badge tone="warn">{tr("Belum ada, semua Manager", "None, all Managers")}</Badge>}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-500">{tr("Superintendent (verifikator)", "Superintendent (verifies)")}</dt>
                    <dd className="mt-0.5 font-medium text-ink-800">{r.areaSupts.length ? r.areaSupts.map((x) => x.name).join(", ") : <Badge tone="warn">{tr("Belum ada", "None")}</Badge>}</dd>
                  </div>
                </dl>
                <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-ink-100 pt-3">
                  {[
                    [tr("Pengawas", "Supervisors"), r.areaPengawas.length],
                    [tr("Verifikasi", "Verification"), r.verif],
                    [tr("Keputusan", "Decision"), r.decide],
                    [tr("Perbaikan", "Corrective action"), r.fix],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="min-w-0">
                      <dt className="truncate text-xs text-ink-500">{k}</dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-ink-900">{v}</dd>
                    </div>
                  ))}
                </dl>
                {r.noAtasan > 0 && <p className="mt-2 text-xs font-semibold text-[#8a6a0a]">{tr(`${r.noAtasan} Pengawas tanpa atasan`, `${r.noAtasan} Supervisor${r.noAtasan === 1 ? "" : "s"} without a superior`)}</p>}
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>{tr("Area", "Area")}</th>
                  <th>{tr("Manager (pemutus)", "Manager (decides)")}</th>
                  <th>{tr("Superintendent (verifikator)", "Superintendent (verifies)")}</th>
                  <th className="text-right">{tr("Pengawas", "Supervisors")}</th>
                  <th className="text-right">{tr("Tunggu verifikasi", "Awaiting verification")}</th>
                  <th className="text-right">{tr("Tunggu keputusan", "Awaiting decision")}</th>
                  <th className="text-right">{tr("Perbaikan", "Corrective action")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><span className="text-xs font-bold tracking-wide tabular-nums text-brand-700">{r.code}</span> <span className="font-medium">{r.name}</span></td>
                    <td>{r.managerOk ? r.manager!.name : <Badge tone="warn">{tr("Belum ada, semua Manager", "None, all Managers")}</Badge>}</td>
                    <td>{r.areaSupts.length ? r.areaSupts.map((x) => x.name).join(", ") : <Badge tone="warn">{tr("Belum ada", "None")}</Badge>}</td>
                    <td className="text-right tabular-nums">
                      {r.areaPengawas.length}
                      {r.noAtasan > 0 && <div className="whitespace-nowrap text-xs font-semibold text-[#8a6a0a]">{tr(`${r.noAtasan} tanpa atasan`, `${r.noAtasan} without a superior`)}</div>}
                    </td>
                    <td className="text-right tabular-nums">{r.verif}</td>
                    <td className="text-right tabular-nums">{r.decide}</td>
                    <td className="text-right tabular-nums">{r.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unmappedOpen > 0 && (
            <p className="mt-3 text-xs text-ink-500">
              {tr(
                `${unmappedOpen} laporan terbuka belum terpetakan ke area (GPS di luar radius dan pelapor tanpa area).`,
                `${unmappedOpen} open report${unmappedOpen === 1 ? " is" : "s are"} not yet mapped to an area (GPS outside the radius and reporter without an area).`,
              )}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={tr("Garis atasan Pengawas", "Supervisor reporting lines")} subtitle={tr("Atasan menerima tugas verifikasi laporan bawahannya", "Superiors receive the verification tasks for their subordinates' reports")} />
        <CardBody className="pt-3">
          {pengawasList.length === 0 ? (
            <p className="text-sm text-ink-500">{tr("Belum ada Pengawas aktif.", "There are no active Supervisors yet.")}</p>
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
                        <dt className="text-xs text-ink-500">{tr("Area", "Area")}</dt>
                        <dd className="mt-0.5 font-medium text-ink-800">{areas.find((a) => a.id === p.areaId)?.name ?? <Badge tone="warn">{tr("Belum diatur", "Not set")}</Badge>}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-ink-500">{tr("Atasan", "Superior")}</dt>
                        <dd className="mt-0.5 font-medium text-ink-800">{validAtasan(p) ? p.atasan!.name : <Badge tone="warn">{tr("Belum ada", "None")}</Badge>}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="table">
                  <thead><tr><th>{tr("Pengawas", "Supervisor")}</th><th>{tr("Area", "Area")}</th><th>{tr("Atasan (Superintendent)", "Superior (Superintendent)")}</th></tr></thead>
                  <tbody>
                    {pengawasList.map((p) => (
                      <tr key={p.id}>
                        <td><div className="font-medium">{p.name ?? "-"}</div><div className="text-xs text-ink-500">{p.email}</div></td>
                        <td>{areas.find((a) => a.id === p.areaId)?.name ?? <Badge tone="warn">{tr("Belum diatur", "Not set")}</Badge>}</td>
                        <td>{validAtasan(p) ? p.atasan!.name : <Badge tone="warn">{tr("Belum ada atasan aktif", "No active superior")}</Badge>}</td>
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
