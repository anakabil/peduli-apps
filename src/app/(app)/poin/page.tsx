import { Award, Gift, History, Trophy } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { pointBalance, pointEarned, levelFor, ledgerNote, EARN_LEDGER_FILTER } from "@/lib/points";
import { PageHeader, Card, CardBody, CardHeader, Badge } from "@/components/ui";
import { labels } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";
import { fmtDateTime, fmtDate, jktDate, jktParts, cn } from "@/lib/format";
import { RedeemButton } from "./redeem-button";
import { RewardVisual } from "@/components/reward/reward-visual";
import { ILLUSTRATION, levelImg } from "@/lib/icons";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Poin dan reward", "Points and rewards") };
}

const num = (n: number) => n.toLocaleString("id-ID");
const signed = (n: number) => (n > 0 ? `+${num(n)}` : num(n));

export default async function PoinPage() {
  const user = await requireUser(["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"]);
  const { lang, tr } = await getTr();
  const L = labels(lang);
  const STEPS = [tr("Kumpulkan poin", "Earn points"), tr("Pilih hadiah", "Choose a reward"), tr("Ajukan penukaran", "Submit a redemption"), tr("Tim pengelola memproses", "The program team processes it")];
  const settings = await getSettings();
  const [balance, earned, ledger, rewards, redemptions, leaderboard] = await Promise.all([
    pointBalance(user.id),
    pointEarned(user.id),
    db.pointLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30, include: { report: { select: { id: true, number: true } } } }),
    db.reward.findMany({ where: { active: true }, orderBy: { pointsCost: "asc" } }),
    db.redemption.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { reward: { select: { name: true } } } }),
    db.pointLedger.groupBy({ by: ["userId"], where: { ...EARN_LEDGER_FILTER, createdAt: { gte: jktDate(jktParts().y, 0, 1) } }, _sum: { points: true }, orderBy: { _sum: { points: "desc" } }, take: 5 }),
  ]);
  const level = levelFor(earned, settings.levels, lang);
  const progress = level.next ? Math.min(100, Math.round((earned / level.next) * 100)) : 100;
  const leaders = await db.user.findMany({ where: { id: { in: leaderboard.map((l) => l.userId) } }, select: { id: true, name: true, jabatan: true } });
  const eligible = settings.eligibleRoles.includes(user.role as (typeof settings.eligibleRoles)[number]);
  const board = leaderboard.filter((l) => (l._sum.points ?? 0) > 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={tr("Program reward", "Reward program")}
        title={tr("Poin dan reward", "Points and rewards")}
        description={tr("Kualitas di atas jumlah. Poin masuk setelah laporan diverifikasi, dan akumulasi menentukan level.", "Quality over quantity. Points are credited after a report is verified, and your total determines your level.")}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 [&>*]:min-w-0 stagger">
        {/* Kartu saldo tidak ikut meregang setinggi katalog */}
        <div className="relative self-start overflow-hidden rounded-3xl bg-brand-800 p-6 text-white shadow-card lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-brand-200">{tr("Saldo poin", "Point balance")}</div>
            <Award size={22} className="text-gold" />
          </div>
          <div className="mt-2 text-5xl font-extrabold tracking-tight tabular-nums">{num(balance)}</div>
          <div className="mt-1 text-sm text-white/70">
            <span className="tabular-nums">{num(earned)}</span> {tr("poin diperoleh seluruh waktu", "points earned all time")}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: level.color === "#8a9199" ? "#d7dce1" : level.color }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={levelImg(level.name)} alt="" aria-hidden width={28} height={28} className="-my-1 size-7 drop-shadow" /> Level {level.label}
            </span>
            {level.next && (
              <span className="text-white/70">
                <span className="tabular-nums">{num(level.next - earned)}</span> {tr("poin ke level berikutnya", "points to the next level")}
              </span>
            )}
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={tr("Progres level", "Level progress")}>
            <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          {!eligible && <p className="mt-4 text-xs text-white/70">{tr("Peran Anda saat ini tidak termasuk penerima poin sesuai pengaturan program.", "Your current role is not eligible for points under the program settings.")}</p>}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader title={tr("Katalog hadiah", "Reward catalogue")} subtitle={tr("Ditetapkan tim pengelola sesuai anggaran dan kebijakan.", "Set by the program team in line with budget and policy.")} action={<Gift size={18} className="shrink-0 text-brand-600" />} />
          <CardBody className="pt-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {rewards.map((r) => {
                const short = r.pointsCost - balance;
                const outOfStock = r.stock <= 0;
                const affordable = short <= 0 && !outOfStock;
                const reason = outOfStock ? tr("Stok habis", "Out of stock") : short > 0 ? tr(`Kurang ${num(short)} poin`, `${num(short)} points short`) : !eligible ? tr("Tidak berlaku", "Not applicable") : undefined;
                return (
                  <div key={r.id} className="group card card-hover flex flex-col p-3">
                    <RewardVisual id={r.id} icon={r.icon} imageAt={r.imageAt} name={r.name} />
                    <div className="mt-2.5 text-sm font-bold leading-snug text-ink-900">{r.name}</div>
                    {r.description && <div className="mt-0.5 line-clamp-2 text-xs text-ink-500">{r.description}</div>}
                    {/* Blok harga dan tombol selalu rata bawah meski nama hadiah membungkus */}
                    <div className="mt-auto pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="badge bg-gold/15 tabular-nums text-[#7a5f10]">{tr(`${num(r.pointsCost)} poin`, `${num(r.pointsCost)} points`)}</span>
                        <span className={cn("text-xs tabular-nums", outOfStock ? "font-medium text-red" : "text-ink-500")}>{tr("Stok", "Stock")} {num(r.stock)}</span>
                      </div>
                      <div className="mt-2.5">
                        <RedeemButton rewardId={r.id} disabled={!affordable || !eligible} reason={reason} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {rewards.length === 0 && <p className="col-span-full text-sm text-ink-500">{tr("Katalog belum tersedia.", "The catalogue is not available yet.")}</p>}
            </div>

            <div className="mt-5 border-t border-ink-100 pt-4">
              <div className="mb-2.5 text-[13px] font-medium text-ink-700">{tr("Cara menukar poin", "How to redeem points")}</div>
              <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold tabular-nums text-brand-700 ring-1 ring-brand-200">{i + 1}</span>
                    <span className="text-xs font-medium leading-snug text-ink-700 sm:text-[13px]">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="self-start lg:col-span-2 anim-fade-up">
          <CardHeader title={tr("Riwayat poin", "Point history")} action={<History size={18} className="shrink-0 text-brand-600" />} />
          <CardBody className="pt-3">
            {ledger.length === 0 ? (
              <p className="text-sm text-ink-500">{tr("Belum ada riwayat. Poin pertama Anda menunggu laporan valid.", "No history yet. Your first points await a valid report.")}</p>
            ) : (
              <>
                {/* Seluler: daftar bertumpuk */}
                <ul className="-my-1 divide-y divide-ink-100 md:hidden">
                  {ledger.map((l) => (
                    <li key={l.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-900">{L.LEDGER_LABEL[l.type] ?? l.type}</div>
                        {l.note && <div className="mt-0.5 line-clamp-2 text-xs text-ink-500">{ledgerNote(l.note, lang)}</div>}
                        <div className="mt-1 text-xs tabular-nums text-ink-500">{fmtDate(l.createdAt, lang)}</div>
                      </div>
                      <div className={cn("shrink-0 text-sm font-bold tabular-nums", l.points >= 0 ? "text-brand-700" : "text-red")}>{signed(l.points)}</div>
                    </li>
                  ))}
                </ul>
                {/* Desktop: tabel */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{tr("Tanggal", "Date")}</th>
                        <th>{tr("Keterangan", "Description")}</th>
                        <th className="text-right">{tr("Poin", "Points")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((l) => (
                        <tr key={l.id}>
                          <td className="whitespace-nowrap tabular-nums text-ink-500">{fmtDate(l.createdAt, lang)}</td>
                          <td>
                            <div className="font-medium text-ink-900">{L.LEDGER_LABEL[l.type] ?? l.type}</div>
                            {l.note && <div className="text-xs text-ink-500">{ledgerNote(l.note, lang)}</div>}
                          </td>
                          <td className={cn("text-right font-bold tabular-nums", l.points >= 0 ? "text-brand-700" : "text-red")}>{signed(l.points)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card className="anim-fade-up">
            <CardHeader title={tr("Penukaran saya", "My redemptions")} />
            <CardBody className="pt-3">
              {redemptions.length === 0 ? (
                <div className="flex flex-col items-center py-2 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ILLUSTRATION.kosongPenukaran} alt="" aria-hidden width={128} height={96} className="h-auto w-28" />
                  <p className="mt-1 text-sm text-ink-500">{tr("Belum ada penukaran.", "No redemptions yet.")}</p>
                </div>
              ) : (
                <ul className="-my-1 divide-y divide-ink-100">
                  {redemptions.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-ink-900">{r.reward.name}</div>
                        <div className="text-xs tabular-nums text-ink-500">{fmtDateTime(r.createdAt, false, lang)}</div>
                      </div>
                      <Badge tone={r.status === "SELESAI" ? "success" : r.status === "DITOLAK" ? "danger" : r.status === "DIPROSES" ? "info" : "warn"}>{L.REDEMPTION_LABEL[r.status] ?? r.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          <Card className="anim-fade-up">
            <CardHeader title={tr("Pelapor teratas tahun ini", "Top reporters this year")} action={<Trophy size={18} className="shrink-0 text-gold" />} />
            <CardBody className="pt-3">
              {board.length === 0 ? (
                <p className="text-sm text-ink-500">{tr("Belum ada poin yang diperoleh tahun ini.", "No points have been earned this year yet.")}</p>
              ) : (
                <ol className="space-y-2.5">
                  {board.map((l, i) => {
                    const u = leaders.find((x) => x.id === l.userId);
                    return (
                      <li key={l.userId} className="flex items-center gap-3 text-sm">
                        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums", i === 0 ? "bg-gold text-white" : "bg-ink-100 text-ink-600")}>{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-medium text-ink-800">
                          {u?.name ?? "-"}
                          {u?.id === user.id ? tr(" (Anda)", " (You)") : ""}
                        </span>
                        <span className="font-bold tabular-nums text-brand-700">{num(l._sum.points ?? 0)}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
