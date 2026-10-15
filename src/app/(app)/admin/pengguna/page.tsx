import Link from "next/link";
import { Users, UserPlus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardBody, Badge } from "@/components/ui";
import { ROLE_LABEL, USER_STATUS_LABEL, type Role } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { UserEditor, NewUserForm } from "./editor";

export const metadata = { title: "Pengguna" };

const PAGE = 50;

export default async function PenggunaPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  await requireUser(["ADMIN"]);
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
  const balances = await db.pointLedger.groupBy({ by: ["userId"], where: { userId: { in: users.map((u) => u.id) } }, _sum: { points: true } });
  const balance = new Map(balances.map((b) => [b.userId, b._sum.points ?? 0]));
  const supervisors = activeSupervisors.map((u) => ({ id: u.id, name: u.name ?? "-", role: u.role }));
  const activeAreas = allAreas.filter((a) => a.active).map((a) => ({ id: a.id, name: a.name }));
  const areasFor = (areaId: string | null) => {
    const cur = areaId ? allAreas.find((a) => a.id === areaId) : null;
    return cur && !cur.active ? [...activeAreas, { id: cur.id, name: `${cur.name} (nonaktif)` }] : activeAreas;
  };
  const supervisorsFor = (u: (typeof users)[number]) => {
    const list = supervisors.filter((s) => s.id !== u.id);
    if (u.atasan && !list.some((s) => s.id === u.atasan!.id)) list.push({ id: u.atasan.id, name: `${u.atasan.name ?? "-"} (${u.atasan.status === "ACTIVE" ? "peran tidak sesuai" : "nonaktif"})`, role: u.atasan.role });
    return list;
  };
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.status ? { status: sp.status } : {}), page: String(p) })}`;

  return (
    <div>
      <PageHeader eyebrow="Administrasi" title="Pengguna dan peran" description="Satu akun untuk satu orang. Tetapkan peran, area kerja, dan atasan agar alur verifikasi berjalan otomatis." />
      <div className="mb-4 flex flex-wrap items-center gap-2 no-print">
        <form className="flex gap-2">
          <input name="q" defaultValue={sp.q ?? ""} className="input w-56" placeholder="Cari nama, email, NIK" />
          <select name="status" defaultValue={sp.status ?? ""} className="input w-auto">
            <option value="">Semua status</option>
            <option value="PENDING">Menunggu persetujuan</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
          <button className="btn-secondary">Terapkan</button>
        </form>
        <details className="ml-auto">
          <summary className="btn-primary cursor-pointer list-none"><UserPlus size={16} /> Tambah pengguna</summary>
          <div className="card mt-2 w-[min(92vw,560px)] p-4 absolute right-4 md:right-8 z-20 shadow-float anim-scale-in">
            <NewUserForm areas={activeAreas} supervisors={supervisors} />
          </div>
        </details>
      </div>

      {pendingCount > 0 && sp.status !== "PENDING" && (
        <div className="mb-4 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-ink-800">
          <b>{pendingCount} akun menunggu persetujuan.</b> Tetapkan peran dan area, lalu ubah status menjadi Aktif.
        </div>
      )}

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Pengguna</th><th>Peran</th><th>Status</th><th>Area / atasan</th><th className="text-right">Laporan</th><th className="text-right">Poin</th><th>Terakhir masuk</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="font-semibold text-ink-800">{u.name}</div>
                    <div className="text-xs text-ink-500">{u.email}{u.nik ? ` - ${u.nik}` : ""}</div>
                    <div className="text-xs text-ink-500">{u.jabatan}{u.departemen ? `, ${u.departemen}` : ""}</div>
                  </td>
                  <td><Badge tone="neutral">{ROLE_LABEL[u.role as Role]}</Badge></td>
                  <td><Badge tone={u.status === "ACTIVE" ? "success" : u.status === "PENDING" ? "warn" : "danger"}>{USER_STATUS_LABEL[u.status]}</Badge></td>
                  <td className="text-xs text-ink-600">{u.area?.name ?? "-"}<br />{u.atasan?.name ?? "-"}</td>
                  <td className="text-right">{u._count.reports}</td>
                  <td className="text-right font-semibold">{balance.get(u.id) ?? 0}</td>
                  <td className="text-xs text-ink-500 whitespace-nowrap">{fmtDateTime(u.lastLoginAt)}</td>
                  <td><UserEditor user={{ id: u.id, name: u.name ?? "", role: u.role, status: u.status, nik: u.nik, jabatan: u.jabatan, departemen: u.departemen, areaId: u.areaId, atasanId: u.atasanId }} areas={areasFor(u.areaId)} supervisors={supervisorsFor(u)} /></td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-ink-500"><Users className="mx-auto mb-2" /> Tidak ada pengguna.</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-ink-500">
          {page > 1 && <Link className="btn-secondary btn-sm" href={qs(page - 1)}>Sebelumnya</Link>}
          <span>Halaman {page} dari {pages} ({total} pengguna)</span>
          {page < pages && <Link className="btn-secondary btn-sm" href={qs(page + 1)}>Berikutnya</Link>}
        </div>
      )}
    </div>
  );
}
