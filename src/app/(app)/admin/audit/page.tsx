import Link from "next/link";
import { ScrollText } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { labels, type Role } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";
import type { Lang } from "@/lib/i18n";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Jejak audit", "Audit trail") };
}
const PAGE = 50;

const ENTITY_LABEL: Record<string, string> = { Report: "Laporan", User: "Pengguna", Area: "Area", Reward: "Hadiah", Redemption: "Penukaran", Setting: "Pengaturan" };
const ENTITY_LABEL_EN: Record<string, string> = { Report: "Hazard report", User: "User", Area: "Work area", Reward: "Reward", Redemption: "Redemption", Setting: "Settings", Consultation: "OHS consultation", Sistem: "System" };
const KEY_LABEL: Record<string, string> = {
  before: "sebelum", after: "sesudah", points: "poin", note: "catatan", status: "status", reason: "alasan", role: "peran", email: "email",
  result: "hasil", number: "nomor", path: "jalur", pic: "penanggung jawab", target: "target", pct: "progres", onTime: "tepat waktu",
  bonus: "bonus", name: "nama", code: "kode", stock: "stok", pointsCost: "nilai poin", tier: "tingkat", icon: "ikon", active: "aktif",
  description: "deskripsi", radiusM: "radius (m)", managerId: "manager", areaId: "area", atasanId: "atasan", jabatan: "jabatan", levels: "level",
};
const KEY_LABEL_EN: Record<string, string> = {
  before: "before", after: "after", points: "points", note: "note", status: "status", reason: "reason", role: "role", email: "email",
  result: "result", number: "number", path: "route", pic: "person in charge", target: "target date", pct: "progress", onTime: "on time",
  bonus: "bonus", name: "name", code: "code", stock: "stock", pointsCost: "point value", tier: "tier", icon: "icon", active: "active",
  description: "description", radiusM: "radius (m)", managerId: "manager", areaId: "area", atasanId: "superior", jabatan: "position", levels: "levels",
  departemen: "department", nik: "employee ID (NIK)", topic: "topic", assigneeId: "assignee", foto: "photo", dummy: "dummy account",
  laporanTerhapus: "reports deleted", akun: "accounts", laporan: "hazard reports", provider: "provider",
};

/** Label bahasa Inggris untuk kode aksi audit; bahasa Indonesia memakai kode yang dirapikan */
const ACTION_LABEL_EN: Record<string, string> = {
  MASUK: "Signed in",
  KELUAR: "Signed out",
  LAPORAN_DIBUAT: "Hazard report created",
  LAPORAN_DIVERIFIKASI: "Hazard report verified",
  LAPORAN_DIREVISI: "Hazard report revision requested",
  LAPORAN_DISETUJUI: "Hazard report approved",
  LAPORAN_DITOLAK: "Hazard report rejected",
  LAPORAN_DITUTUP: "Hazard report closed",
  PROGRES_DIPERBARUI: "Progress updated",
  PERBAIKAN_SELESAI: "Corrective action completed",
  PENUTUPAN_DITOLAK: "Closure rejected",
  AUDIT_ACAK: "Random audit",
  PENGGUNA_DIBUAT: "User created",
  PENGGUNA_DIPERBARUI: "User updated",
  PENGGUNA_DIHAPUS: "User deleted",
  AKUN_DUMMY_DIHAPUS: "Dummy accounts deleted",
  AREA_DIBUAT: "Work area created",
  AREA_DIPERBARUI: "Work area updated",
  REWARD_DIBUAT: "Reward created",
  REWARD_DIPERBARUI: "Reward updated",
  PENUKARAN_DIAJUKAN: "Redemption submitted",
  PENUKARAN_DIPROSES: "Redemption processed",
  POIN_DISESUAIKAN: "Points adjusted",
  PENGATURAN_DIUBAH: "Settings changed",
  DATA_UJI_DIHAPUS: "Trial data deleted",
  KONSULTASI_DIAJUKAN: "OHS consultation submitted",
  KONSULTASI_DITERUSKAN: "OHS consultation forwarded",
  KONSULTASI_TIDAK_DITERUSKAN: "OHS consultation not forwarded",
  KONSULTASI_DIJAWAB: "OHS consultation answered",
  KONSULTASI_DITAMPILKAN: "OHS consultation published",
  KONSULTASI_DISEMBUNYIKAN: "OHS consultation hidden",
};

type Pair = { k: string; v: string };
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const keyLabel = (k: string, lang: Lang) => (lang === "en" ? KEY_LABEL_EN : KEY_LABEL)[k] ?? k;
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function fmtVal(v: unknown, lang: Lang): string {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? (lang === "en" ? "yes" : "ya") : lang === "en" ? "no" : "tidak";
  if (Array.isArray(v)) return v.length ? v.map((x) => (isObj(x) ? JSON.stringify(x) : fmtVal(x, lang))).join(", ") : "-";
  if (isObj(v)) return JSON.stringify(v);
  return String(v);
}

// Ratakan objek bersarang menjadi pasangan kunci-nilai, kunci bertingkat digabung dengan "/"
function flatten(v: unknown, lang: Lang, prefix = "", depth = 0, out: Record<string, string> = {}) {
  if (isObj(v) && depth < 3) {
    for (const [k, x] of Object.entries(v)) flatten(x, lang, prefix ? `${prefix} / ${keyLabel(k, lang)}` : keyLabel(k, lang), depth + 1, out);
  } else {
    out[prefix || (lang === "en" ? "value" : "nilai")] = fmtVal(v, lang);
  }
  return out;
}

// Detail audit tersimpan sebagai JSON; tampilkan sebagai pasangan yang mudah dibaca
function parseDetail(raw: string | null, lang: Lang): Pair[] {
  if (!raw) return [];
  let d: unknown;
  try {
    d = JSON.parse(raw);
  } catch {
    return [{ k: "", v: raw }];
  }
  if (!isObj(d)) return [{ k: "", v: fmtVal(d, lang) }];
  const pairs: Pair[] = [];
  const { before, after, ...rest } = d;
  // Bila ada sebelum dan sesudah, tampilkan hanya yang berubah
  if (isObj(before) && isObj(after)) {
    const b = flatten(before, lang);
    const a = flatten(after, lang);
    for (const k of Object.keys(a)) {
      if (!(k in b)) pairs.push({ k, v: a[k] });
      else if (b[k] !== a[k]) pairs.push({ k, v: `${b[k]} → ${a[k]}` });
    }
    if (!pairs.length) pairs.push(lang === "en" ? { k: "changes", v: "none" } : { k: "perubahan", v: "tidak ada" });
  } else {
    if (before !== undefined) rest.before = before;
    if (after !== undefined) rest.after = after;
  }
  for (const [k, v] of Object.entries(flatten(rest, lang))) pairs.push({ k, v });
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

function Detail({ raw, lang }: { raw: string | null; lang: Lang }) {
  const pairs = parseDetail(raw, lang);
  if (!pairs.length) return <span className="text-xs text-ink-400">-</span>;
  const head = pairs.slice(0, 4);
  const rest = pairs.slice(4);
  return (
    <div className="text-xs leading-relaxed">
      <PairList pairs={head} />
      {rest.length > 0 && (
        <details className="group">
          <summary className="mt-0.5 cursor-pointer list-none font-medium text-brand-700 hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{lang === "en" ? `${rest.length} more` : `${rest.length} lainnya`}</span>
            <span className="hidden group-open:inline">{lang === "en" ? "Show less" : "Ringkas"}</span>
          </summary>
          <div className="mt-0.5"><PairList pairs={rest} /></div>
        </details>
      )}
    </div>
  );
}

const actionLabel = (a: string, lang: Lang) => (lang === "en" && ACTION_LABEL_EN[a]) || sentence(a.replace(/_/g, " ").toLowerCase());

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requireUser(["ADMIN"]);
  const { lang, tr } = await getTr();
  const L = labels(lang);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where = sp.q ? { OR: [{ action: { contains: sp.q, mode: "insensitive" as const } }, { actor: { name: { contains: sp.q, mode: "insensitive" as const } } }, { entityId: { contains: sp.q, mode: "insensitive" as const } }] } : {};
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { actor: { select: { name: true, role: true } } } }),
    db.auditLog.count({ where }),
  ]);
  const q = encodeURIComponent(sp.q ?? "");
  const entity = (l: (typeof logs)[number]) =>
    l.entity === "Report" && l.entityId ? <Link href={`/laporan/${l.entityId}`} className="font-medium text-brand-700 hover:underline">{tr("Laporan", "Hazard report")}</Link> : l.entity ? ((lang === "en" ? ENTITY_LABEL_EN : ENTITY_LABEL)[l.entity] ?? l.entity) : "-";

  return (
    <div>
      <PageHeader
        eyebrow={tr("Tata kelola", "Governance")}
        title={tr("Jejak audit", "Audit trail")}
        description={tr("Perubahan status, keputusan, aturan alur, serta masuk dan keluar tercatat lengkap dengan pelaku dan waktunya.", "Status changes, decisions, workflow rules, and sign-ins and sign-outs are recorded with the actor and time.")}
      />
      <form className="mb-3 flex gap-2 no-print">
        <input name="q" defaultValue={sp.q ?? ""} className="input min-h-11 min-w-0 flex-1 sm:w-72 sm:flex-none md:min-h-0" placeholder={tr("Cari aksi, pelaku, atau ID", "Search action, actor, or ID")} aria-label={tr("Cari jejak audit", "Search the audit trail")} />
        <button className="btn-secondary min-h-11 shrink-0 md:min-h-0">{tr("Cari", "Search")}</button>
      </form>
      {logs.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={22} />}
          title={tr("Tidak ada catatan", "No records")}
          description={sp.q ? tr("Tidak ada catatan yang cocok dengan pencarian ini.", "No records match this search.") : tr("Catatan aktivitas akan muncul di sini.", "Activity records will appear here.")}
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Layar sempit: daftar bertumpuk */}
          <ul className="divide-y divide-ink-100 md:hidden">
            {logs.map((l) => (
              <li key={l.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="badge badge-neutral whitespace-normal" title={l.action}>{actionLabel(l.action, lang)}</span>
                  <span className="shrink-0 text-right text-xs tabular-nums text-ink-500">{fmtDateTime(l.createdAt, true, lang)}</span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium text-ink-900">{l.actor?.name ?? tr("Sistem", "System")}</span>
                  {l.actor && <span className="text-ink-500">, {L.ROLE_LABEL[l.actor.role as Role]}</span>}
                </div>
                <div className="mt-0.5 text-xs text-ink-500">{tr("Entitas", "Entity")}: {entity(l)}</div>
                {l.detail && <div className="mt-2 rounded-lg bg-ink-50 px-3 py-2"><Detail raw={l.detail} lang={lang} /></div>}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="table">
              <thead><tr><th>{tr("Waktu", "Time")}</th><th>{tr("Pelaku", "Actor")}</th><th>{tr("Aksi", "Action")}</th><th>{tr("Entitas", "Entity")}</th><th>{tr("Detail", "Details")}</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap text-xs tabular-nums text-ink-500">{fmtDateTime(l.createdAt, true, lang)}</td>
                    <td><div className="text-sm font-medium">{l.actor?.name ?? tr("Sistem", "System")}</div><div className="text-xs text-ink-500">{l.actor ? L.ROLE_LABEL[l.actor.role as Role] : ""}</div></td>
                    <td><span className="badge badge-neutral" title={l.action}>{actionLabel(l.action, lang)}</span></td>
                    <td className="text-xs">{entity(l)}</td>
                    <td className="min-w-64 max-w-md"><Detail raw={l.detail} lang={lang} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-ink-500">
        {page > 1 && <Link className="btn-secondary btn-sm min-h-11 md:min-h-0" href={`?page=${page - 1}&q=${q}`}>{tr("Sebelumnya", "Previous")}</Link>}
        <span className="tabular-nums">{tr(`Halaman ${page} dari ${Math.max(1, Math.ceil(total / PAGE))}`, `Page ${page} of ${Math.max(1, Math.ceil(total / PAGE))}`)}</span>
        {page * PAGE < total && <Link className="btn-secondary btn-sm min-h-11 md:min-h-0" href={`?page=${page + 1}&q=${q}`}>{tr("Berikutnya", "Next")}</Link>}
      </div>
    </div>
  );
}
