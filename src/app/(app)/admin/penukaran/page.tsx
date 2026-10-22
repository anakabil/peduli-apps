import { Inbox } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { REDEMPTION_LABEL } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { ProcessButtons } from "./buttons";

export const metadata = { title: "Penukaran poin" };

const tone = (s: string) => (s === "SELESAI" ? "success" : s === "DITOLAK" ? "danger" : s === "DIPROSES" ? "info" : "warn");

export default async function PenukaranPage() {
  await requireUser(["ADMIN"]);
  const items = await db.redemption.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200, include: { user: { select: { name: true, email: true, jabatan: true } }, reward: true, processedBy: { select: { name: true } } } });
  const open = items.filter((i) => i.status === "DIAJUKAN" || i.status === "DIPROSES");
  const done = items.filter((i) => i.status === "SELESAI" || i.status === "DITOLAK");
  type Item = (typeof items)[number];
  const isOpen = (r: Item) => r.status === "DIAJUKAN" || r.status === "DIPROSES";

  const statusCell = (r: Item) => (
    <>
      <Badge tone={tone(r.status)}>{REDEMPTION_LABEL[r.status]}</Badge>
      {r.note && <div className="mt-1 text-xs text-ink-500">{r.note}</div>}
      {r.processedBy && <div className="text-xs text-ink-400">oleh {r.processedBy.name}</div>}
    </>
  );

  // Layar sempit: daftar kartu bertumpuk
  const renderItem = (r: Item) => (
    <li key={r.id} className="rounded-xl border border-ink-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-ink-900">{r.user.name}</div>
          <div className="truncate text-xs text-ink-500">{r.user.jabatan ?? r.user.email}</div>
        </div>
        <Badge tone={tone(r.status)}>{REDEMPTION_LABEL[r.status]}</Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-ink-500">Hadiah</dt>
          <dd className="mt-0.5 font-medium text-ink-800">{r.reward.name}</dd>
          <dd className="text-xs tabular-nums text-ink-500">{r.pointsCost} poin</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-ink-500">Diajukan</dt>
          <dd className="mt-0.5 text-xs tabular-nums text-ink-700">{fmtDateTime(r.createdAt)}</dd>
        </div>
      </dl>
      {(r.note || r.processedBy) && (
        <div className="mt-2 text-xs text-ink-500">
          {r.note && <div>{r.note}</div>}
          {r.processedBy && <div className="text-ink-400">oleh {r.processedBy.name}</div>}
        </div>
      )}
      {isOpen(r) && (
        <div className="mt-3 border-t border-ink-100 pt-3">
          <ProcessButtons id={r.id} status={r.status} />
        </div>
      )}
    </li>
  );

  const renderRow = (r: Item, withActions: boolean) => (
    <tr key={r.id}>
      <td><div className="font-semibold">{r.user.name}</div><div className="text-xs text-ink-500">{r.user.jabatan ?? r.user.email}</div></td>
      <td><div className="font-medium">{r.reward.name}</div><div className="text-xs tabular-nums text-ink-500">{r.pointsCost} poin</div></td>
      <td className="whitespace-nowrap text-xs tabular-nums text-ink-500">{fmtDateTime(r.createdAt)}</td>
      <td>{statusCell(r)}</td>
      {withActions && <td>{isOpen(r) && <ProcessButtons id={r.id} status={r.status} />}</td>}
    </tr>
  );

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Administrasi" title="Penukaran poin" description="Proses pengajuan penukaran hadiah. Penolakan mengembalikan poin dan stok secara otomatis." />
      <Card>
        <CardHeader title="Menunggu diproses" subtitle={open.length ? `${open.length} pengajuan perlu ditindaklanjuti` : "Semua pengajuan sudah diproses"} />
        <CardBody className="pt-4">
          {open.length === 0 ? (
            <EmptyState icon={<Inbox size={22} />} title="Tidak ada pengajuan yang menunggu" description="Pengajuan penukaran baru dari pengguna akan muncul di sini." />
          ) : (
            <>
              <ul className="space-y-2.5 md:hidden">{open.map(renderItem)}</ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="table">
                  <thead><tr><th>Pengguna</th><th>Hadiah</th><th>Diajukan</th><th>Status</th><th>Tindakan</th></tr></thead>
                  <tbody>{open.map((r) => renderRow(r, true))}</tbody>
                </table>
              </div>
            </>
          )}
        </CardBody>
      </Card>
      {done.length > 0 && (
        <Card>
          <CardHeader title="Riwayat" subtitle="Pengajuan yang selesai atau ditolak" />
          <CardBody className="pt-4">
            <ul className="space-y-2.5 md:hidden">{done.map(renderItem)}</ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead><tr><th>Pengguna</th><th>Hadiah</th><th>Diajukan</th><th>Status</th></tr></thead>
                <tbody>{done.map((r) => renderRow(r, false))}</tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
