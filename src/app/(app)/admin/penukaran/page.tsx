
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { ILLUSTRATION } from "@/lib/icons";
import { labels } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { ProcessButtons } from "./buttons";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Penukaran poin", "Point redemptions") };
}

const tone = (s: string) => (s === "SELESAI" ? "success" : s === "DITOLAK" ? "danger" : s === "DIPROSES" ? "info" : "warn");

export default async function PenukaranPage() {
  await requireUser(["ADMIN"]);
  const { lang, tr } = await getTr();
  const L = labels(lang);
  const items = await db.redemption.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200, include: { user: { select: { name: true, email: true, jabatan: true } }, reward: true, processedBy: { select: { name: true } } } });
  const open = items.filter((i) => i.status === "DIAJUKAN" || i.status === "DIPROSES");
  const done = items.filter((i) => i.status === "SELESAI" || i.status === "DITOLAK");
  type Item = (typeof items)[number];
  const isOpen = (r: Item) => r.status === "DIAJUKAN" || r.status === "DIPROSES";

  const statusCell = (r: Item) => (
    <>
      <Badge tone={tone(r.status)}>{L.REDEMPTION_LABEL[r.status]}</Badge>
      {r.note && <div className="mt-1 text-xs text-ink-500">{r.note}</div>}
      {r.processedBy && <div className="text-xs text-ink-400">{tr("oleh", "by")} {r.processedBy.name}</div>}
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
        <Badge tone={tone(r.status)}>{L.REDEMPTION_LABEL[r.status]}</Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-ink-500">{tr("Hadiah", "Reward")}</dt>
          <dd className="mt-0.5 font-medium text-ink-800">{r.reward.name}</dd>
          <dd className="text-xs tabular-nums text-ink-500">{tr(`${r.pointsCost} poin`, `${r.pointsCost} points`)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-ink-500">{tr("Diajukan", "Submitted")}</dt>
          <dd className="mt-0.5 text-xs tabular-nums text-ink-700">{fmtDateTime(r.createdAt, false, lang)}</dd>
        </div>
      </dl>
      {(r.note || r.processedBy) && (
        <div className="mt-2 text-xs text-ink-500">
          {r.note && <div>{r.note}</div>}
          {r.processedBy && <div className="text-ink-400">{tr("oleh", "by")} {r.processedBy.name}</div>}
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
      <td><div className="font-medium">{r.reward.name}</div><div className="text-xs tabular-nums text-ink-500">{tr(`${r.pointsCost} poin`, `${r.pointsCost} points`)}</div></td>
      <td className="whitespace-nowrap text-xs tabular-nums text-ink-500">{fmtDateTime(r.createdAt, false, lang)}</td>
      <td>{statusCell(r)}</td>
      {withActions && <td>{isOpen(r) && <ProcessButtons id={r.id} status={r.status} />}</td>}
    </tr>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={tr("Administrasi", "Administration")}
        title={tr("Penukaran poin", "Point redemptions")}
        description={tr("Proses pengajuan penukaran hadiah. Penolakan mengembalikan poin dan stok secara otomatis.", "Process reward redemption requests. Rejection returns the points and stock automatically.")}
      />
      <Card>
        <CardHeader
          title={tr("Menunggu diproses", "Awaiting processing")}
          subtitle={open.length ? tr(`${open.length} pengajuan perlu ditindaklanjuti`, `${open.length} request${open.length === 1 ? " needs" : "s need"} action`) : tr("Semua pengajuan sudah diproses", "All requests have been processed")}
        />
        <CardBody className="pt-4">
          {open.length === 0 ? (
            <EmptyState image={ILLUSTRATION.kosongPenukaran} title={tr("Tidak ada pengajuan yang menunggu", "No pending requests")} description={tr("Pengajuan penukaran baru dari pengguna akan muncul di sini.", "New redemption requests from users will appear here.")} />
          ) : (
            <>
              <ul className="space-y-2.5 md:hidden">{open.map(renderItem)}</ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="table">
                  <thead><tr><th>{tr("Pengguna", "User")}</th><th>{tr("Hadiah", "Reward")}</th><th>{tr("Diajukan", "Submitted")}</th><th>{tr("Status", "Status")}</th><th>{tr("Tindakan", "Action")}</th></tr></thead>
                  <tbody>{open.map((r) => renderRow(r, true))}</tbody>
                </table>
              </div>
            </>
          )}
        </CardBody>
      </Card>
      {done.length > 0 && (
        <Card>
          <CardHeader title={tr("Riwayat", "History")} subtitle={tr("Pengajuan yang selesai atau ditolak", "Completed or rejected requests")} />
          <CardBody className="pt-4">
            <ul className="space-y-2.5 md:hidden">{done.map(renderItem)}</ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead><tr><th>{tr("Pengguna", "User")}</th><th>{tr("Hadiah", "Reward")}</th><th>{tr("Diajukan", "Submitted")}</th><th>{tr("Status", "Status")}</th></tr></thead>
                <tbody>{done.map((r) => renderRow(r, false))}</tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
