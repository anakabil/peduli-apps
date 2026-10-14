import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardBody } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/constants";

export const metadata = { title: "Jejak audit" };
const PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where = sp.q ? { OR: [{ action: { contains: sp.q, mode: "insensitive" as const } }, { actor: { name: { contains: sp.q, mode: "insensitive" as const } } }, { entityId: { contains: sp.q, mode: "insensitive" as const } }] } : {};
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { actor: { select: { name: true, role: true } } } }),
    db.auditLog.count({ where }),
  ]);
  return (
    <div>
      <PageHeader eyebrow="Tata kelola" title="Jejak audit" description="Perubahan status, keputusan, aturan alur, serta masuk dan keluar tercatat lengkap dengan pelaku dan waktunya." />
      <form className="mb-3 flex gap-2 no-print"><input name="q" defaultValue={sp.q ?? ""} className="input w-64" placeholder="Cari aksi, pelaku, atau ID" /><button className="btn-secondary">Cari</button></form>
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="table">
            <thead><tr><th>Waktu</th><th>Pelaku</th><th>Aksi</th><th>Entitas</th><th>Detail</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-xs text-ink-500">{fmtDateTime(l.createdAt, true)}</td>
                  <td><div className="text-sm font-medium">{l.actor?.name ?? "Sistem"}</div><div className="text-xs text-ink-500">{l.actor ? ROLE_LABEL[l.actor.role as Role] : ""}</div></td>
                  <td><span className="badge badge-neutral font-mono">{l.action}</span></td>
                  <td className="text-xs">{l.entity === "Report" && l.entityId ? <Link href={`/laporan/${l.entityId}`} className="text-brand-700 hover:underline">Laporan</Link> : l.entity ?? "-"}</td>
                  <td className="max-w-md truncate font-mono text-[11px] text-ink-500" title={l.detail ?? ""}>{l.detail ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-ink-500">
        {page > 1 && <Link className="btn-secondary btn-sm" href={`?page=${page - 1}&q=${sp.q ?? ""}`}>Sebelumnya</Link>}
        <span>Halaman {page} dari {Math.max(1, Math.ceil(total / PAGE))}</span>
        {page * PAGE < total && <Link className="btn-secondary btn-sm" href={`?page=${page + 1}&q=${sp.q ?? ""}`}>Berikutnya</Link>}
      </div>
    </div>
  );
}
