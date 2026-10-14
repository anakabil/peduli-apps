import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardBody, Badge } from "@/components/ui";
import { REDEMPTION_LABEL } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { ProcessButtons } from "./buttons";

export const metadata = { title: "Penukaran poin" };

export default async function PenukaranPage() {
  await requireUser(["ADMIN"]);
  const items = await db.redemption.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200, include: { user: { select: { name: true, email: true, jabatan: true } }, reward: true, processedBy: { select: { name: true } } } });
  const open = items.filter((i) => i.status === "DIAJUKAN" || i.status === "DIPROSES");
  const done = items.filter((i) => i.status === "SELESAI" || i.status === "DITOLAK");
  const Row = ({ r }: { r: (typeof items)[number] }) => (
    <tr>
      <td><div className="font-semibold">{r.user.name}</div><div className="text-xs text-ink-500">{r.user.jabatan ?? r.user.email}</div></td>
      <td><div className="font-medium">{r.reward.name}</div><div className="text-xs text-ink-500">{r.pointsCost} poin</div></td>
      <td className="text-xs text-ink-500 whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
      <td><Badge tone={r.status === "SELESAI" ? "success" : r.status === "DITOLAK" ? "danger" : r.status === "DIPROSES" ? "info" : "warn"}>{REDEMPTION_LABEL[r.status]}</Badge>{r.note && <div className="mt-1 text-xs text-ink-500">{r.note}</div>}{r.processedBy && <div className="text-[11px] text-ink-400">oleh {r.processedBy.name}</div>}</td>
      <td>{(r.status === "DIAJUKAN" || r.status === "DIPROSES") && <ProcessButtons id={r.id} status={r.status} />}</td>
    </tr>
  );
  return (
    <div>
      <PageHeader eyebrow="Administrasi" title="Penukaran poin" description="Proses pengajuan penukaran hadiah. Penolakan mengembalikan poin dan stok secara otomatis." />
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="table">
            <thead><tr><th>Pengguna</th><th>Hadiah</th><th>Diajukan</th><th>Status</th><th>Tindakan</th></tr></thead>
            <tbody>
              {open.map((r) => <Row key={r.id} r={r} />)}
              {open.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-ink-500">Tidak ada pengajuan yang menunggu.</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>
      {done.length > 0 && (
        <Card className="mt-4">
          <CardBody className="p-0 overflow-x-auto">
            <div className="px-4 pt-4 text-sm font-bold">Riwayat</div>
            <table className="table">
              <thead><tr><th>Pengguna</th><th>Hadiah</th><th>Diajukan</th><th>Status</th><th></th></tr></thead>
              <tbody>{done.map((r) => <Row key={r.id} r={r} />)}</tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
