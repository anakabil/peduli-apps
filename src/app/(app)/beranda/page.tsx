import Link from "next/link";
import { PlusCircle, ShieldCheck, Gavel, Wrench, Award, BarChart3, Users, Star, ArrowRight, AlertTriangle, Clock, TrendingUp, FileCheck2, Bell } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computeStats, currentMonthPeriod } from "@/lib/stats";
import { pointBalance, pointEarned, levelFor } from "@/lib/points";
import { reportScope, verifiableWhere } from "@/lib/workflow";
import { Stat, Card, CardHeader, CardBody } from "@/components/ui";
import { ReportList } from "@/components/report/report-list";
import { RiskBadge } from "@/components/report/badges";
import { fmtNumber, fmtMonthLong, cn } from "@/lib/format";
import { ROLE_LABEL, STATUS_LABEL, type Role, type Status } from "@/lib/constants";
import { MiniTrend } from "@/components/charts/mini-trend";

export const metadata = { title: "Beranda" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "numeric", hour12: false }).format(new Date()));
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function BerandaPage() {
  const user = await requireUser();
  const role = user.role as Role;
  const now = new Date();
  const period = currentMonthPeriod(now);
  const settings = await getSettings();

  const showStats = role === "DIREKSI" || role === "MANAGER" || role === "ADMIN";
  const showPoints = settings.eligibleRoles.includes(role);
  const queueWhere =
    role === "SUPERINTENDENT"
      ? { where: verifiableWhere(user), due: "dueVerifyAt" as const }
      : role === "MANAGER"
        ? { where: { status: "MENUNGGU_KEPUTUSAN", ...(settings.managerPeerReview ? { reporterId: { not: user.id } } : {}) }, due: "dueDecideAt" as const }
        : null;

  // Seluruh kueri beranda dijalankan bersamaan agar waktu muat tidak menumpuk
  const [recent, myOpen, notifs, queueCounts, picCount, stats, points, myMonth, myValid, adminExtra] = await Promise.all([
    db.report.findMany({
      where: reportScope(user),
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { area: { select: { name: true } }, reporter: { select: { name: true, role: true } }, photos: { select: { id: true }, take: 1 } },
    }),
    db.report.count({ where: { reporterId: user.id, status: { in: ["MENUNGGU_VERIFIKASI", "PERLU_REVISI", "MENUNGGU_KEPUTUSAN", "DALAM_PERBAIKAN", "MENUNGGU_PENUTUPAN"] } } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
    queueWhere ? Promise.all([db.report.count({ where: queueWhere.where }), db.report.count({ where: { ...queueWhere.where, [queueWhere.due]: { lt: now } } })]) : null,
    db.report.count({ where: { picId: user.id, status: "DALAM_PERBAIKAN" } }),
    showStats ? computeStats(period) : null,
    showPoints ? Promise.all([pointBalance(user.id), pointEarned(user.id)]) : ([0, 0] as const),
    db.report.count({ where: { reporterId: user.id, createdAt: { gte: period.from } } }),
    db.report.count({ where: { reporterId: user.id, pointsAwarded: { gt: 0 } } }),
    role === "ADMIN" ? Promise.all([db.user.count({ where: { status: "PENDING" } }), db.redemption.count({ where: { status: "DIAJUKAN" } })]) : null,
  ]);
  const [balance, earned] = points;
  const level = levelFor(earned, settings.levels);

  // Widget khusus peran
  let queue: { label: string; count: number; href: string; icon: React.ReactNode; overdue: number } | null = null;
  if (queueCounts && role === "SUPERINTENDENT") queue = { label: "Menunggu verifikasi Anda", count: queueCounts[0], href: "/verifikasi", icon: <ShieldCheck size={20} />, overdue: queueCounts[1] };
  else if (queueCounts && role === "MANAGER") queue = { label: "Menunggu keputusan Anda", count: queueCounts[0], href: "/keputusan", icon: <Gavel size={20} />, overdue: queueCounts[1] };

  return (
    <div className="space-y-6">
      {/* Sapaan */}
      <div className="hero-pattern relative overflow-hidden rounded-3xl p-6 text-white md:p-8 anim-fade-up">
        <div className="absolute inset-0 grid-lines opacity-50" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-200">{user.jabatan && !user.jabatan.toLowerCase().startsWith(ROLE_LABEL[role].toLowerCase()) ? `${ROLE_LABEL[role]}, ${user.jabatan}` : user.jabatan || ROLE_LABEL[role]}</div>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight md:text-3xl">
              {greeting()}, {user.name?.split(" ")[0]}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              {role === "PENGAWAS" && "Setiap bahaya yang Anda laporkan hari ini mencegah cedera esok hari. Laporan valid memperoleh poin."}
              {role === "SUPERINTENDENT" && "Verifikasi tepat waktu menjaga alur pelaporan tetap bergerak dan memberi kepastian bagi Pengawas."}
              {role === "MANAGER" && "Keputusan yang cepat dan sumber daya yang jelas adalah kunci penutupan tepat waktu."}
              {role === "DIREKSI" && `Ringkasan kondisi program PEDULI untuk ${fmtMonthLong(now)} sebagai dasar kebijakan.`}
              {role === "ADMIN" && "Kelola akun, katalog reward, dan pengaturan program PEDULI dari satu tempat."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/lapor" className="btn bg-white text-brand-800 hover:bg-brand-50">
              <PlusCircle size={18} /> Lapor bahaya
            </Link>
            {showStats && (
              <Link href="/statistik" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
                <BarChart3 size={18} /> Statistik
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Kartu tugas dan ringkasan pribadi */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] stagger">
        {queue && (
          <Link href={queue.href} className={cn("card card-hover col-span-2 p-4 md:p-5 border-l-4", queue.overdue > 0 ? "border-l-red" : "border-l-brand-500")}>
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-700">{queue.icon}</div>
              <ArrowRight size={16} className="text-ink-300" />
            </div>
            <div className="mt-3 text-3xl font-bold tabular-nums">{queue.count}</div>
            <div className="text-sm font-semibold text-ink-700">{queue.label}</div>
            {queue.overdue > 0 && (
              <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red">
                <AlertTriangle size={12} /> {queue.overdue} melewati batas waktu
              </div>
            )}
          </Link>
        )}
        {adminExtra && (
          <>
            <Link href="/admin/pengguna?status=PENDING" className="card card-hover p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-brand-50 p-2 text-brand-700"><Users size={20} /></div>
                <ArrowRight size={16} className="text-ink-300" />
              </div>
              <div className="mt-3 text-3xl font-bold tabular-nums">{adminExtra[0]}</div>
              <div className="text-sm font-semibold text-ink-700">Akun menunggu persetujuan</div>
            </Link>
            <Link href="/admin/penukaran" className="card card-hover p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-gold/10 p-2 text-gold"><Star size={20} /></div>
                <ArrowRight size={16} className="text-ink-300" />
              </div>
              <div className="mt-3 text-3xl font-bold tabular-nums">{adminExtra[1]}</div>
              <div className="text-sm font-semibold text-ink-700">Penukaran poin diajukan</div>
            </Link>
          </>
        )}
        {showPoints && (
          <Link href="/poin" className="card card-hover p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-gold/10 p-2 text-gold"><Award size={20} /></div>
              <span className="badge" style={{ background: `${level.color}22`, color: level.color }}>{level.name}</span>
            </div>
            <div className="mt-3 text-3xl font-bold tabular-nums">{fmtNumber(balance)}</div>
            <div className="text-sm font-semibold text-ink-700">Saldo poin</div>
          </Link>
        )}
        <Link href="/laporan" className="card card-hover p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-brand-50 p-2 text-brand-700"><FileCheck2 size={20} /></div>
          </div>
          <div className="mt-3 text-3xl font-bold tabular-nums">{myMonth}</div>
          <div className="text-sm font-semibold text-ink-700">Laporan saya bulan ini</div>
          <div className="mt-1 text-xs text-ink-500">{myValid} valid seluruh waktu, {myOpen} masih berjalan</div>
        </Link>
        {picCount > 0 && (
          <Link href="/tindak-lanjut" className="card card-hover p-4 md:p-5 border-l-4 border-l-amber">
            <div className="rounded-lg bg-amber/10 p-2 text-[#8a6a0a] w-fit"><Wrench size={20} /></div>
            <div className="mt-3 text-3xl font-bold tabular-nums">{picCount}</div>
            <div className="text-sm font-semibold text-ink-700">Perbaikan yang Anda tangani</div>
          </Link>
        )}
      </div>

      {/* KPI untuk Manager, Direksi, Admin */}
      {stats && (
        <section className="anim-fade-up">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="section-title">Kondisi program</div>
              <h2 className="text-lg font-bold">{fmtMonthLong(now)}</h2>
            </div>
            <Link href="/statistik" className="text-sm font-semibold text-brand-700 hover:underline">
              Lihat statistik lengkap
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 stagger [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
            <Stat label="Laporan masuk" value={stats.summary.total} delta={stats.summary.deltaTotalPct != null ? `${stats.summary.deltaTotalPct > 0 ? "+" : ""}${fmtNumber(stats.summary.deltaTotalPct, 1)}% dari bulan lalu` : "Belum ada pembanding"} tone={stats.summary.deltaTotalPct != null && stats.summary.deltaTotalPct >= 0 ? "good" : "neutral"} icon={<TrendingUp size={16} />} />
            <Stat label="Partisipasi pelapor" value={`${fmtNumber(stats.summary.participation, 1)}%`} delta={`${stats.summary.reporters} dari ${stats.summary.activeUsers} pengguna`} icon={<Users size={16} />} />
            <Stat label="Waktu penutupan" value={`${fmtNumber(stats.summary.closureDays, 1)} hari`} delta={stats.summary.prevClosureDays ? `${fmtNumber(stats.summary.prevClosureDays, 1)} hari bulan lalu` : "rerata"} tone={stats.summary.closureDays <= stats.summary.prevClosureDays ? "good" : "warn"} icon={<Clock size={16} />} />
            <Stat label="Penutupan tepat waktu" value={`${fmtNumber(stats.summary.onTime, 1)}%`} delta={`${stats.summary.closedInPeriod} laporan ditutup`} tone={stats.summary.onTime >= 80 ? "good" : "warn"} icon={<FileCheck2 size={16} />} />
            <Stat label="Risiko tinggi terbuka" value={stats.summary.highOpen} delta={`${stats.summary.overdueOpen} lewat target`} tone={stats.summary.overdueOpen > 0 ? "bad" : stats.summary.highOpen > 0 ? "warn" : "good"} icon={<AlertTriangle size={16} />} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Tren laporan masuk dan ditutup" subtitle="12 bulan terakhir" />
              <CardBody className="pt-3">
                <MiniTrend data={stats.trend} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Risiko tinggi masih terbuka" subtitle="Prioritas eskalasi" />
              <CardBody className="pt-3">
                {stats.highOpenList.length === 0 ? (
                  <p className="text-sm text-ink-500">Tidak ada. Pertahankan.</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.highOpenList.slice(0, 5).map((r) => (
                      <li key={r.id}>
                        <Link href={`/laporan/${r.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-50">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{r.number} <span className="font-normal text-ink-500">- {r.area}</span></div>
                            <div className="text-xs text-ink-500">{STATUS_LABEL[r.status as Status]} - {r.days} hari</div>
                          </div>
                          <RiskBadge risk={r.risk} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </section>
      )}

      {/* Laporan terbaru dan notifikasi */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 anim-fade-up">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold">Laporan terbaru</h2>
            <Link href="/laporan" className="text-sm font-semibold text-brand-700 hover:underline">Semua laporan</Link>
          </div>
          <ReportList reports={recent} emptyDesc="Mulai dengan membuat laporan bahaya pertama Anda." />
        </section>
        <section className="anim-fade-up">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold">Notifikasi</h2>
            <Link href="/notifikasi" className="text-sm font-semibold text-brand-700 hover:underline">Semua</Link>
          </div>
          <Card>
            {notifs.length === 0 ? (
              <CardBody className="flex flex-col items-center py-8 text-center">
                <div className="rounded-xl bg-ink-100 p-2.5 text-ink-500"><Bell size={18} /></div>
                <p className="mt-2 text-sm font-medium text-ink-700">Belum ada notifikasi</p>
                <p className="text-xs text-ink-500">Kabar verifikasi dan keputusan akan muncul di sini.</p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-ink-100">
                {notifs.map((n) => (
                  <li key={n.id}>
                    <Link href={n.link ?? "/notifikasi"} className={cn("block px-4 py-3 hover:bg-ink-50", !n.readAt && "bg-brand-50/40")}>
                      <div className="text-sm font-semibold text-ink-800">{n.title}</div>
                      {n.body && <div className="line-clamp-2 text-xs text-ink-500">{n.body}</div>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
