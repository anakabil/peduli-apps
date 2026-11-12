import Link from "next/link";
import { Users, UserPlus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardBody, Badge } from "@/components/ui";
import { labels, type Role } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";
import { fmtDateTime } from "@/lib/format";
import { UserEditor, NewUserForm } from "./editor";
import { DeleteUserButton, DummyAccounts } from "./delete";
import { DEMO_DOMAIN } from "@/lib/demo-accounts";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Pengguna", "Users") };
}

const PAGE = 50;

export default async function PenggunaPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const me = await requireUser(["ADMIN"]);
  const { lang, tr } = await getTr();
  const L = labels(lang);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where = { ...(sp.status ? { status: sp.status } : {}), ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" as const } }, { email: { contains: sp.q, mode: "insensitive" as const } }, { nik: { contains: sp.q, mode: "insensitive" as const } }] } : {}) };
  const [users, total, allAreas, activeSupervisors, pendingCount] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ status: "asc" }, { role: "asc" }, { name: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { area: { select: { name: true } }, atasan: { select: { id: true, name: true, role: true, status: true } }, _count: { select: { reports: true } } },
    }),
    db.user.count({ where }),
    db.area.findMany({ select: { id: true, name: true, active: true }, orderBy: { name: "asc" } }),
    // Calon atasan diambil terpisah dari filter agar pilihan atasan tidak hilang saat daftar difilter
    db.user.findMany({ where: { status: "ACTIVE", role: { in: ["SUPERINTENDENT", "MANAGER", "DIREKSI"] } }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" } }),
    db.user.count({ where: { status: "PENDING" } }),
  ]);
  const dummyWhere = { email: { endsWith: DEMO_DOMAIN } };
  const [dummyCount, dummyReports] = await Promise.all([db.user.count({ where: dummyWhere }), db.report.count({ where: { reporter: dummyWhere } })]);
  const isDummy = (email: string | null) => !!email?.toLowerCase().endsWith(DEMO_DOMAIN);
  const del = (u: (typeof users)[number]) => (u.id === me.id ? null : <DeleteUserButton id={u.id} name={u.name ?? u.email ?? "-"} dummy={isDummy(u.email)} reports={u._count.reports} />);
  const balances = await db.pointLedger.groupBy({ by: ["userId"], where: { userId: { in: users.map((u) => u.id) } }, _sum: { points: true } });
  const balance = new Map(balances.map((b) => [b.userId, b._sum.points ?? 0]));
  const supervisors = activeSupervisors.map((u) => ({ id: u.id, name: u.name ?? "-", role: u.role }));
  const activeAreas = allAreas.filter((a) => a.active).map((a) => ({ id: a.id, name: a.name }));
  const areasFor = (areaId: string | null) => {
    const cur = areaId ? allAreas.find((a) => a.id === areaId) : null;
    return cur && !cur.active ? [...activeAreas, { id: cur.id, name: `${cur.name} (${tr("nonaktif", "inactive")})` }] : activeAreas;
  };
  const supervisorsFor = (u: (typeof users)[number]) => {
    const list = supervisors.filter((s) => s.id !== u.id);
    if (u.atasan && !list.some((s) => s.id === u.atasan!.id)) list.push({ id: u.atasan.id, name: `${u.atasan.name ?? "-"} (${u.atasan.status === "ACTIVE" ? tr("peran tidak sesuai", "role mismatch") : tr("nonaktif", "inactive")})`, role: u.atasan.role });
    return list;
  };
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.status ? { status: sp.status } : {}), page: String(p) })}`;

  return (
    <div>
      <PageHeader
        eyebrow={tr("Administrasi", "Administration")}
        title={tr("Pengguna dan peran", "Users and roles")}
        description={tr("Satu akun untuk satu orang. Tetapkan peran, area kerja, dan atasan agar alur verifikasi berjalan otomatis.", "One account per person. Assign the role, work area, and superior so the verification flow runs automatically.")}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 no-print">
        <form className="flex w-full flex-wrap gap-2 sm:w-auto">
          <input name="q" defaultValue={sp.q ?? ""} className="input min-w-0 flex-1 sm:w-56 sm:flex-none" placeholder={tr("Cari nama, email, NIK", "Search name, email, NIK")} aria-label={tr("Cari pengguna", "Search users")} />
          <select name="status" defaultValue={sp.status ?? ""} className="input w-full sm:w-auto" aria-label={tr("Status", "Status")}>
            <option value="">{tr("Semua status", "All statuses")}</option>
            <option value="PENDING">{tr("Menunggu persetujuan", "Awaiting approval")}</option>
            <option value="ACTIVE">{tr("Aktif", "Active")}</option>
            <option value="INACTIVE">{tr("Nonaktif", "Inactive")}</option>
          </select>
          <button className="btn-secondary">{tr("Terapkan", "Apply")}</button>
        </form>
        <details className="w-full sm:ml-auto sm:w-auto">
          <summary className="btn-primary w-full cursor-pointer list-none sm:w-auto"><UserPlus size={16} /> {tr("Tambah pengguna", "Add user")}</summary>
          <div className="card fixed inset-x-3 top-16 z-50 max-h-[80dvh] overflow-y-auto p-4 shadow-float anim-scale-in md:absolute md:inset-x-auto md:top-auto md:right-8 md:mt-2 md:w-[560px]">
            <NewUserForm areas={activeAreas} supervisors={supervisors} />
          </div>
        </details>
      </div>

      {dummyCount > 0 && <DummyAccounts count={dummyCount} reports={dummyReports} />}

      {pendingCount > 0 && sp.status !== "PENDING" && (
        <div className="mb-4 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-ink-800">
          <b>{tr(`${pendingCount} akun menunggu persetujuan.`, `${pendingCount} account${pendingCount === 1 ? " is" : "s are"} awaiting approval.`)}</b>{" "}
          {tr("Tetapkan peran dan area, lalu ubah status menjadi Aktif.", "Assign the role and area, then change the status to Active.")}
        </div>
      )}

      {/* Ponsel: daftar kartu, tombol Ubah selalu terlihat */}
      <div className="space-y-2.5 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-ink-900">{u.name}</div>
                <div className="truncate text-xs text-ink-500">{u.email}</div>
              </div>
              <Badge tone={u.status === "ACTIVE" ? "success" : u.status === "PENDING" ? "warn" : "danger"}>{L.USER_STATUS_LABEL[u.status]}</Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div><dt className="text-ink-500">{tr("Peran", "Role")}</dt><dd className="font-medium text-ink-800">{L.ROLE_LABEL[u.role as Role]}</dd></div>
              <div><dt className="text-ink-500">{tr("Area", "Area")}</dt><dd className="font-medium text-ink-800">{u.area?.name ?? "-"}</dd></div>
              <div><dt className="text-ink-500">{tr("Atasan", "Superior")}</dt><dd className="font-medium text-ink-800">{u.atasan?.name ?? "-"}</dd></div>
              <div>
                <dt className="text-ink-500">{tr("Laporan dan poin", "Reports and points")}</dt>
                <dd className="font-medium tabular-nums text-ink-800">{tr(`${u._count.reports} laporan, ${balance.get(u.id) ?? 0} poin`, `${u._count.reports} report${u._count.reports === 1 ? "" : "s"}, ${balance.get(u.id) ?? 0} points`)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex justify-end gap-2 border-t border-ink-100 pt-3">
              {del(u)}
              <UserEditor user={{ id: u.id, name: u.name ?? "", role: u.role, status: u.status, nik: u.nik, jabatan: u.jabatan, departemen: u.departemen, areaId: u.areaId, atasanId: u.atasanId }} areas={areasFor(u.areaId)} supervisors={supervisorsFor(u)} />
            </div>
          </div>
        ))}
        {users.length === 0 && <div className="card p-8 text-center text-sm text-ink-500"><Users className="mx-auto mb-2" /> {tr("Tidak ada pengguna.", "No users.")}</div>}
      </div>

      <Card className="hidden md:block">
        <CardBody className="p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>{tr("Pengguna", "User")}</th><th>{tr("Peran", "Role")}</th><th>{tr("Status", "Status")}</th><th>{tr("Area / atasan", "Area / superior")}</th><th className="text-right">{tr("Laporan", "Reports")}</th><th className="text-right">{tr("Poin", "Points")}</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="font-semibold text-ink-800">{u.name}</div>
                    <div className="text-xs text-ink-500">{u.email}{u.nik ? ` - ${u.nik}` : ""}</div>
                    <div className="text-xs text-ink-500">{u.jabatan}{u.departemen ? `, ${u.departemen}` : ""}</div>
                  </td>
                  <td className="whitespace-nowrap"><Badge tone="neutral">{L.ROLE_LABEL[u.role as Role]}</Badge></td>
                  <td>
                    <Badge tone={u.status === "ACTIVE" ? "success" : u.status === "PENDING" ? "warn" : "danger"}>{L.USER_STATUS_LABEL[u.status]}</Badge>
                    <div className="mt-1 text-[11px] leading-tight text-ink-500" title={tr("Terakhir masuk", "Last sign-in")}>
                      {u.lastLoginAt ? tr(`Masuk ${fmtDateTime(u.lastLoginAt, false, lang)}`, `Signed in ${fmtDateTime(u.lastLoginAt, false, lang)}`) : tr("Belum pernah masuk", "Never signed in")}
                    </div>
                  </td>
                  <td className="text-xs text-ink-600">{u.area?.name ?? "-"}<br />{u.atasan?.name ?? "-"}</td>
                  <td className="text-right">{u._count.reports}</td>
                  <td className="text-right font-semibold">{balance.get(u.id) ?? 0}</td>
                  <td>
                    <div className="flex flex-col items-stretch gap-1.5">
                      <UserEditor user={{ id: u.id, name: u.name ?? "", role: u.role, status: u.status, nik: u.nik, jabatan: u.jabatan, departemen: u.departemen, areaId: u.areaId, atasanId: u.atasanId }} areas={areasFor(u.areaId)} supervisors={supervisorsFor(u)} />
                      {del(u)}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-ink-500"><Users className="mx-auto mb-2" /> {tr("Tidak ada pengguna.", "No users.")}</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-ink-500">
          {page > 1 && <Link className="btn-secondary btn-sm" href={qs(page - 1)}>{tr("Sebelumnya", "Previous")}</Link>}
          <span>{tr(`Halaman ${page} dari ${pages} (${total} pengguna)`, `Page ${page} of ${pages} (${total} user${total === 1 ? "" : "s"})`)}</span>
          {page < pages && <Link className="btn-secondary btn-sm" href={qs(page + 1)}>{tr("Berikutnya", "Next")}</Link>}
        </div>
      )}
    </div>
  );
}
