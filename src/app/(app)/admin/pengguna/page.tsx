import { Users, UserPlus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardBody, Badge } from "@/components/ui";
import { ROLE_LABEL, USER_STATUS_LABEL, type Role } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { UserEditor, NewUserForm } from "./editor";

export const metadata = { title: "Pengguna" };

export default async function PenggunaPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const [users, areas, balances] = await Promise.all([
    db.user.findMany({
      where: { ...(sp.status ? { status: sp.status } : {}), ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" as const } }, { email: { contains: sp.q, mode: "insensitive" as const } }, { nik: { contains: sp.q, mode: "insensitive" as const } }] } : {}) },
      orderBy: [{ status: "asc" }, { role: "asc" }, { name: "asc" }],
      include: { area: { select: { name: true } }, atasan: { select: { name: true } }, _count: { select: { reports: true } } },
    }),
    db.area.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.pointLedger.groupBy({ by: ["userId"], _sum: { points: true } }),
  ]);
  const balance = new Map(balances.map((b) => [b.userId, b._sum.points ?? 0]));
  const supervisors = users.filter((u) => u.status === "ACTIVE" && (u.role === "SUPERINTENDENT" || u.role === "MANAGER")).map((u) => ({ id: u.id, name: u.name ?? "-", role: u.role }));
  const pending = users.filter((u) => u.status === "PENDING");

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
            <NewUserForm areas={areas} supervisors={supervisors} />
          </div>
        </details>
      </div>

      {pending.length > 0 && !sp.status && (
        <div className="mb-4 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-ink-800">
          <b>{pending.length} akun menunggu persetujuan.</b> Tetapkan peran dan area, lalu ubah status menjadi Aktif.
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
                  <td><UserEditor user={{ id: u.id, name: u.name ?? "", role: u.role, status: u.status, nik: u.nik, jabatan: u.jabatan, departemen: u.departemen, areaId: u.areaId, atasanId: u.atasanId }} areas={areas} supervisors={supervisors.filter((s) => s.id !== u.id)} /></td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-ink-500"><Users className="mx-auto mb-2" /> Tidak ada pengguna.</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
