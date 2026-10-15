import { Award, Gift, History, Trophy, Umbrella, CupSoda, Footprints, Ticket, Package } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { pointBalance, pointEarned, levelFor, EARN_LEDGER_FILTER } from "@/lib/points";
import { PageHeader, Card, CardBody, CardHeader, Badge } from "@/components/ui";
import { LEDGER_LABEL, REDEMPTION_LABEL } from "@/lib/constants";
import { fmtDateTime, fmtDate, jktDate, jktParts } from "@/lib/format";
import { RedeemButton } from "./redeem-button";

export const metadata = { title: "Poin dan reward" };

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = { Umbrella, CupSoda, Footprints, Ticket, Package };

export default async function PoinPage() {
  const user = await requireUser(["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"]);
  const settings = await getSettings();
  const [balance, earned, ledger, rewards, redemptions, leaderboard] = await Promise.all([
    pointBalance(user.id),
    pointEarned(user.id),
    db.pointLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30, include: { report: { select: { id: true, number: true } } } }),
    db.reward.findMany({ where: { active: true }, orderBy: { pointsCost: "asc" } }),
    db.redemption.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { reward: true } }),
    db.pointLedger.groupBy({ by: ["userId"], where: { ...EARN_LEDGER_FILTER, createdAt: { gte: jktDate(jktParts().y, 0, 1) } }, _sum: { points: true }, orderBy: { _sum: { points: "desc" } }, take: 5 }),
  ]);
  const level = levelFor(earned, settings.levels);
  const progress = level.next ? Math.min(100, Math.round((earned / level.next) * 100)) : 100;
  const leaders = await db.user.findMany({ where: { id: { in: leaderboard.map((l) => l.userId) } }, select: { id: true, name: true, jabatan: true } });
  const eligible = settings.eligibleRoles.includes(user.role as (typeof settings.eligibleRoles)[number]);
  const board = leaderboard.filter((l) => (l._sum.points ?? 0) > 0);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Program reward" title="Poin dan reward" description="Kualitas di atas jumlah. Poin masuk setelah laporan diverifikasi, dan akumulasi menentukan level." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 stagger">
        <div className="hero-pattern relative overflow-hidden rounded-3xl p-6 text-white lg:col-span-1">
          <div className="absolute inset-0 grid-lines opacity-40" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">Saldo poin</div>
              <Award size={22} className="text-gold" />
            </div>
            <div className="mt-2 text-5xl font-extrabold tracking-tight">{balance}</div>
            <div className="mt-1 text-sm text-white/70">{earned} poin diperoleh seluruh waktu</div>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: level.color === "#8a9199" ? "#d7dce1" : level.color }}>
                <Trophy size={16} /> Level {level.name}
              </span>
              {level.next && <span className="text-white/70">{level.next - earned} poin ke level berikutnya</span>}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-r from-gold to-amber transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            {!eligible && <p className="mt-4 text-xs text-white/60">Peran Anda saat ini tidak termasuk penerima poin sesuai pengaturan program.</p>}
          </div>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader title="Katalog hadiah" subtitle="Ditetapkan tim pengelola sesuai anggaran dan kebijakan." action={<Gift size={18} className="text-brand-600" />} />
          <CardBody className="pt-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {rewards.map((r) => {
                const Icon = ICONS[r.icon ?? "Package"] ?? Package;
                const affordable = balance >= r.pointsCost && r.stock > 0;
                return (
                  <div key={r.id} className="card card-hover flex flex-col p-3">
                    <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700">
                      <Icon size={40} />
                    </div>
                    <div className="mt-2.5 font-bold text-ink-900">{r.name}</div>
                    <div className="text-xs text-ink-500 line-clamp-2">{r.description}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="badge bg-gold/15 text-[#7a5f10]">{r.pointsCost} poin</span>
                      <span className="text-[11px] text-ink-400">Stok {r.stock}</span>
                    </div>
                    <div className="mt-2.5">
                      <RedeemButton rewardId={r.id} disabled={!affordable || !eligible} />
                    </div>
                  </div>
                );
              })}
              {rewards.length === 0 && <p className="col-span-full text-sm text-ink-500">Katalog belum tersedia.</p>}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
              {["Kumpulkan poin", "Pilih hadiah", "Ajukan penukaran", "Tim pengelola memproses"].map((s, i) => (
                <span key={s} className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-ink-100 px-2.5 py-1 font-semibold text-ink-700">{s}</span>
                  {i < 3 && <span className="text-ink-300">&rarr;</span>}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 anim-fade-up">
          <CardHeader title="Riwayat poin" action={<History size={18} className="text-brand-600" />} />
          <CardBody className="pt-3">
            {ledger.length === 0 ? (
              <p className="text-sm text-ink-500">Belum ada riwayat. Poin pertama Anda menunggu laporan valid.</p>
            ) : (
              <table className="table">
                <thead><tr><th>Tanggal</th><th>Keterangan</th><th className="text-right">Poin</th></tr></thead>
                <tbody>
                  {ledger.map((l) => (
                    <tr key={l.id}>
                      <td className="whitespace-nowrap text-ink-500">{fmtDate(l.createdAt)}</td>
                      <td>
                        <div className="font-medium">{LEDGER_LABEL[l.type] ?? l.type}</div>
                        <div className="text-xs text-ink-500">{l.note}</div>
                      </td>
                      <td className={`text-right font-bold ${l.points >= 0 ? "text-brand-700" : "text-red"}`}>{l.points > 0 ? `+${l.points}` : l.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card className="anim-fade-up">
            <CardHeader title="Penukaran saya" />
            <CardBody className="pt-3">
              {redemptions.length === 0 ? (
                <p className="text-sm text-ink-500">Belum ada penukaran.</p>
              ) : (
                <ul className="space-y-2">
                  {redemptions.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                      <div>
                        <div className="font-semibold">{r.reward.name}</div>
                        <div className="text-xs text-ink-500">{fmtDateTime(r.createdAt)}</div>
                      </div>
                      <Badge tone={r.status === "SELESAI" ? "success" : r.status === "DITOLAK" ? "danger" : r.status === "DIPROSES" ? "info" : "warn"}>{REDEMPTION_LABEL[r.status]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          <Card className="anim-fade-up">
            <CardHeader title="Pelapor teratas tahun ini" action={<Trophy size={18} className="text-gold" />} />
            <CardBody className="pt-3">
              <ol className="space-y-2">
                {board.map((l, i) => {
                  const u = leaders.find((x) => x.id === l.userId);
                  return (
                    <li key={l.userId} className="flex items-center gap-3 text-sm">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-gold text-white" : "bg-ink-100 text-ink-600"}`}>{i + 1}</span>
                      <span className="flex-1 truncate font-medium">{u?.name ?? "-"}{u?.id === user.id ? " (Anda)" : ""}</span>
                      <span className="font-bold text-brand-700">{l._sum.points}</span>
                    </li>
                  );
                })}
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
