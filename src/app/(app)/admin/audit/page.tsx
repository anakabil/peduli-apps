import Link from "next/link";
import { ScrollText } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/constants";

export const metadata = { title: "Jejak audit" };
const PAGE = 50;

const ENTITY_LABEL: Record<string, string> = { Report: "Laporan", User: "Pengguna", Area: "Area", Reward: "Hadiah", Redemption: "Penukaran", Setting: "Pengaturan" };
const KEY_LABEL: Record<string, string> = {
  before: "sebelum", after: "sesudah", points: "poin", note: "catatan", status: "status", reason: "alasan", role: "peran", email: "email",
  result: "hasil", number: "nomor", path: "jalur", pic: "penanggung jawab", target: "target", pct: "progres", onTime: "tepat waktu",
  bonus: "bonus", name: "nama", code: "kode", stock: "stok", pointsCost: "nilai poin", tier: "tingkat", icon: "ikon", active: "aktif",
  description: "deskripsi", radiusM: "radius (m)", managerId: "manager", areaId: "area", atasanId: "atasan", jabatan: "jabatan", levels: "level",
};

type Pair = { k: string; v: string };
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const keyLabel = (k: string) => KEY_LABEL[k] ?? k;
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function fmtVal(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "ya" : "tidak";
  if (Array.isArray(v)) return v.length ? v.map((x) => (isObj(x) ? JSON.stringify(x) : fmtVal(x))).join(", ") : "-";
  if (isObj(v)) return JSON.stringify(v);
  return String(v);
}

// Ratakan objek bersarang menjadi pasangan kunci-nilai, kunci bertingkat digabung dengan "/"
function flatten(v: unknown, prefix = "", depth = 0, out: Record<string, string> = {}) {
  if (isObj(v) && depth < 3) {
    for (const [k, x] of Object.entries(v)) flatten(x, prefix ? `${prefix} / ${keyLabel(k)}` : keyLabel(k), depth + 1, out);
  } else {
    out[prefix || "nilai"] = fmtVal(v);
  }
  return out;
}

// Detail audit tersimpan sebagai JSON; tampilkan sebagai pasangan yang mudah dibaca
function parseDetail(raw: string | null): Pair[] {
  if (!raw) return [];
  let d: unknown;
  try {
    d = JSON.parse(raw);
  } catch {
    return [{ k: "", v: raw }];
  }
  if (!isObj(d)) return [{ k: "", v: fmtVal(d) }];
  const pairs: Pair[] = [];
  const { before, after, ...rest } = d;
  // Bila ada sebelum dan sesudah, tampilkan hanya yang berubah
  if (isObj(before) && isObj(after)) {
    const b = flatten(before);
    const a = flatten(after);
    for (const k of Object.keys(a)) {
      if (!(k in b)) pairs.push({ k, v: a[k] });
      else if (b[k] !== a[k]) pairs.push({ k, v: `${b[k]} → ${a[k]}` });
    }
    if (!pairs.length) pairs.push({ k: "perubahan", v: "tidak ada" });
  } else {
    if (before !== undefined) rest.before = before;
    if (after !== undefined) rest.after = after;
  }
  for (const [k, v] of Object.entries(flatten(rest))) pairs.push({ k, v });
  return pairs.map((p) => ({ k: p.k ? sentence(p.k) : "", v: p.v }));
}

function PairList({ pairs }: { pairs: Pair[] }) {
  return (
    <dl className="space-y-0.5">
      {pairs.map((p, i) => (
        <div key={`${p.k}-${i}`} className="flex gap-1.5">
          {p.k && <dt className="shrink-0 text-ink-500">{p.k}:</dt>}
          <dd className="min-w-0 text-ink-700 [overflow-wrap:anywhere]">{p.v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Detail({ raw }: { raw: string | null }) {
  const pairs = parseDetail(raw);
  if (!pairs.length) return <span className="text-xs text-ink-400">-</span>;
  const head = pairs.slice(0, 4);
  const rest = pairs.slice(4);
  return (
    <div className="text-xs leading-relaxed">
      <PairList pairs={head} />
      {rest.length > 0 && (
        <details className="group">
          <summary className="mt-0.5 cursor-pointer list-none font-medium text-brand-700 hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{rest.length} lainnya</span>
            <span className="hidden group-open:inline">Ringkas</span>
          </summary>
          <div className="mt-0.5"><PairList pairs={rest} /></div>
        </details>
      )}
    </div>
  );
}

const actionLabel = (a: string) => sentence(a.replace(/_/g, " ").toLowerCase());

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where = sp.q ? { OR: [{ action: { contains: sp.q, mode: "insensitive" as const } }, { actor: { name: { contains: sp.q, mode: "insensitive" as const } } }, { entityId: { contains: sp.q, mode: "insensitive" as const } }] } : {};
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { actor: { select: { name: true, role: true } } } }),
    db.auditLog.count({ where }),
  ]);
  const q = encodeURIComponent(sp.q ?? "");
  const entity = (l: (typeof logs)[number]) =>
    l.entity === "Report" && l.entityId ? <Link href={`/laporan/${l.entityId}`} className="font-medium text-brand-700 hover:underline">Laporan</Link> : l.entity ? (ENTITY_LABEL[l.entity] ?? l.entity) : "-";

  return (
    <div>
      <PageHeader eyebrow="Tata kelola" title="Jejak audit" description="Perubahan status, keputusan, aturan alur, serta masuk dan keluar tercatat lengkap dengan pelaku dan waktunya." />
      <form className="mb-3 flex gap-2 no-print">
        <input name="q" defaultValue={sp.q ?? ""} className="input min-h-11 min-w-0 flex-1 sm:w-72 sm:flex-none md:min-h-0" placeholder="Cari aksi, pelaku, atau ID" aria-label="Cari jejak audit" />
        <button className="btn-secondary min-h-11 shrink-0 md:min-h-0">Cari</button>
      </form>
      {logs.length === 0 ? (
        <EmptyState icon={<ScrollText size={22} />} title="Tidak ada catatan" description={sp.q ? "Tidak ada catatan yang cocok dengan pencarian ini." : "Catatan aktivitas akan muncul di sini."} />
      ) : (
        <Card className="overflow-hidden">
          {/* Layar sempit: daftar bertumpuk */}
          <ul className="divide-y divide-ink-100 md:hidden">
            {logs.map((l) => (
              <li key={l.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="badge badge-neutral whitespace-normal" title={l.action}>{actionLabel(l.action)}</span>
                  <span className="shrink-0 text-right text-xs tabular-nums text-ink-500">{fmtDateTime(l.createdAt, true)}</span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium text-ink-900">{l.actor?.name ?? "Sistem"}</span>
                  {l.actor && <span className="text-ink-500">, {ROLE_LABEL[l.actor.role as Role]}</span>}
                </div>
                <div className="mt-0.5 text-xs text-ink-500">Entitas: {entity(l)}</div>
                {l.detail && <div className="mt-2 rounded-lg bg-ink-50 px-3 py-2"><Detail raw={l.detail} /></div>}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="table">
              <thead><tr><th>Waktu</th><th>Pelaku</th><th>Aksi</th><th>Entitas</th><th>Detail</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap text-xs tabular-nums text-ink-500">{fmtDateTime(l.createdAt, true)}</td>
                    <td><div className="text-sm font-medium">{l.actor?.name ?? "Sistem"}</div><div className="text-xs text-ink-500">{l.actor ? ROLE_LABEL[l.actor.role as Role] : ""}</div></td>
                    <td><span className="badge badge-neutral" title={l.action}>{actionLabel(l.action)}</span></td>
                    <td className="text-xs">{entity(l)}</td>
                    <td className="min-w-64 max-w-md"><Detail raw={l.detail} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-ink-500">
        {page > 1 && <Link className="btn-secondary btn-sm min-h-11 md:min-h-0" href={`?page=${page - 1}&q=${q}`}>Sebelumnya</Link>}
        <span className="tabular-nums">Halaman {page} dari {Math.max(1, Math.ceil(total / PAGE))}</span>
        {page * PAGE < total && <Link className="btn-secondary btn-sm min-h-11 md:min-h-0" href={`?page=${page + 1}&q=${q}`}>Berikutnya</Link>}
      </div>
    </div>
  );
}
