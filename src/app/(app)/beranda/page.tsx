import Link from "next/link";
import { PlusCircle, ShieldCheck, Gavel, Wrench, Award, BarChart3, Users, Star, ArrowRight, AlertTriangle, Clock, TrendingUp, FileCheck2 } from "lucide-react";
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
import { labels, type Role, type Status } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";
import type { Tr } from "@/lib/i18n";
import { MiniTrend } from "@/components/charts/mini-trend";
import { ILLUSTRATION, levelImg } from "@/lib/icons";
import { PushPrompt } from "@/components/pwa/push-setup";
import { AskForm } from "../konsultasi/forms";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Beranda", "Home") };
}

function greeting(tr: Tr) {
  const h = Number(new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "numeric", hour12: false }).format(new Date()));
  if (h < 11) return tr("Selamat pagi", "Good morning");
  if (h < 15) return tr("Selamat siang", "Good afternoon");
  if (h < 18) return tr("Selamat sore", "Good afternoon");
  return tr("Selamat malam", "Good evening");
}

export default async function BerandaPage() {
  const user = await requireUser();
  const { lang, tr } = await getTr();
  const L = labels(lang);
  const role = user.role as Role;
  const roleLabel = L.ROLE_LABEL[role];
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
    showStats ? computeStats(period, { lang }) : null,
    showPoints ? Promise.all([pointBalance(user.id), pointEarned(user.id)]) : ([0, 0] as const),
    db.report.count({ where: { reporterId: user.id, createdAt: { gte: period.from } } }),
    db.report.count({ where: { reporterId: user.id, pointsAwarded: { gt: 0 } } }),
    role === "ADMIN" ? Promise.all([db.user.count({ where: { status: "PENDING" } }), db.redemption.count({ where: { status: "DIAJUKAN" } })]) : null,
  ]);
  const [balance, earned] = points;
  const level = levelFor(earned, settings.levels, lang);

  // Widget khusus peran
  let queue: { label: string; count: number; href: string; icon: React.ReactNode; overdue: number } | null = null;
  if (queueCounts && role === "SUPERINTENDENT") queue = { label: tr("Menunggu verifikasi Anda", "Awaiting your verification"), count: queueCounts[0], href: "/verifikasi", icon: <ShieldCheck size={20} />, overdue: queueCounts[1] };
  else if (queueCounts && role === "MANAGER") queue = { label: tr("Menunggu keputusan Anda", "Awaiting your decision"), count: queueCounts[0], href: "/keputusan", icon: <Gavel size={20} />, overdue: queueCounts[1] };

  return (
    <div className="space-y-6">
      {/* Sapaan */}
      <div className="hero-pattern relative overflow-hidden rounded-3xl p-6 text-white md:p-8 anim-fade-up">
        <div className="absolute inset-0 grid-lines opacity-50" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-200">{user.jabatan && !user.jabatan.toLowerCase().startsWith(roleLabel.toLowerCase()) ? `${roleLabel}, ${user.jabatan}` : user.jabatan || roleLabel}</div>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight md:text-3xl">
              {greeting(tr)}, {user.name?.split(" ")[0]}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              {role === "PENGAWAS" && tr("Setiap bahaya yang Anda laporkan hari ini mencegah cedera esok hari. Laporan valid memperoleh poin.", "Every hazard you report today prevents an injury tomorrow. Valid reports earn points.")}
              {role === "SUPERINTENDENT" && tr("Verifikasi tepat waktu menjaga alur pelaporan tetap bergerak dan memberi kepastian bagi Pengawas.", "Timely verification keeps the reporting workflow moving and gives Supervisors certainty.")}
              {role === "MANAGER" && tr("Keputusan yang cepat dan sumber daya yang jelas adalah kunci penutupan tepat waktu.", "Prompt decisions and clearly defined resources are the key to on-time closure.")}
              {role === "DIREKSI" && tr(`Ringkasan kondisi program PEDULI untuk ${fmtMonthLong(now)} sebagai dasar kebijakan.`, `An overview of the PEDULI program for ${fmtMonthLong(now, "en")} as a basis for policy.`)}
              {role === "ADMIN" && tr("Kelola akun, katalog reward, dan pengaturan program PEDULI dari satu tempat.", "Manage accounts, the reward catalogue, and PEDULI program settings in one place.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/lapor" className="btn bg-white text-brand-800 hover:bg-brand-50">
              <PlusCircle size={18} /> {tr("Lapor bahaya", "Report a hazard")}
            </Link>
            {showStats && (
              <Link href="/statistik" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
                <BarChart3 size={18} /> {tr("Statistik", "Statistics")}
              </Link>
            )}
          </div>
        </div>
      </div>

      <AskForm prompt />

      <PushPrompt />

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
                <AlertTriangle size={12} /> {tr(`${queue.overdue} melewati batas waktu`, `${queue.overdue} past deadline`)}
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
              <div className="text-sm font-semibold text-ink-700">{tr("Akun menunggu persetujuan", "Accounts awaiting approval")}</div>
            </Link>
            <Link href="/admin/penukaran" className="card card-hover p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-gold/10 p-2 text-gold"><Star size={20} /></div>
                <ArrowRight size={16} className="text-ink-300" />
              </div>
              <div className="mt-3 text-3xl font-bold tabular-nums">{adminExtra[1]}</div>
              <div className="text-sm font-semibold text-ink-700">{tr("Penukaran poin diajukan", "Point redemptions submitted")}</div>
            </Link>
          </>
        )}
        {showPoints && (
          <Link href="/poin" className="card card-hover p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-gold/10 p-2 text-gold"><Award size={20} /></div>
              <span className="badge gap-1" style={{ background: `${level.color}22`, color: level.color }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={levelImg(level.name)} alt="" aria-hidden width={18} height={18} className="-my-1 size-[18px]" />
                {level.label}
              </span>
            </div>
            <div className="mt-3 text-3xl font-bold tabular-nums">{fmtNumber(balance, 0, lang)}</div>
            <div className="text-sm font-semibold text-ink-700">{tr("Saldo poin", "Point balance")}</div>
          </Link>
        )}
        <Link href="/laporan" className="card card-hover p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-brand-50 p-2 text-brand-700"><FileCheck2 size={20} /></div>
          </div>
          <div className="mt-3 text-3xl font-bold tabular-nums">{myMonth}</div>
          <div className="text-sm font-semibold text-ink-700">{tr("Laporan saya bulan ini", "My reports this month")}</div>
          <div className="mt-1 text-xs text-ink-500">{tr(`${myValid} valid seluruh waktu, ${myOpen} masih berjalan`, `${myValid} valid all time, ${myOpen} in progress`)}</div>
        </Link>
        {picCount > 0 && (
          <Link href="/tindak-lanjut" className="card card-hover p-4 md:p-5 border-l-4 border-l-amber">
            <div className="rounded-lg bg-amber/10 p-2 text-[#8a6a0a] w-fit"><Wrench size={20} /></div>
            <div className="mt-3 text-3xl font-bold tabular-nums">{picCount}</div>
            <div className="text-sm font-semibold text-ink-700">{tr("Perbaikan yang Anda tangani", "Corrective actions assigned to you")}</div>
          </Link>
        )}
      </div>

      {/* KPI untuk Manager, Direksi, Admin */}
      {stats && (
        <section className="anim-fade-up">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="section-title">{tr("Kondisi program", "Program status")}</div>
              <h2 className="text-lg font-bold">{fmtMonthLong(now, lang)}</h2>
            </div>
            <Link href="/statistik" className="text-sm font-semibold text-brand-700 hover:underline">
              {tr("Lihat statistik lengkap", "View full statistics")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 stagger [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
            <Stat label={tr("Laporan masuk", "Reports received")} value={stats.summary.total} delta={stats.summary.deltaTotalPct != null ? `${stats.summary.deltaTotalPct > 0 ? "+" : ""}${fmtNumber(stats.summary.deltaTotalPct, 1, lang)}% ${tr("dari bulan lalu", "vs last month")}` : tr("Belum ada pembanding", "No comparison yet")} tone={stats.summary.deltaTotalPct != null && stats.summary.deltaTotalPct >= 0 ? "good" : "neutral"} icon={<TrendingUp size={16} />} />
            <Stat label={tr("Partisipasi pelapor", "Reporter participation")} value={`${fmtNumber(stats.summary.participation, 1, lang)}%`} delta={tr(`${stats.summary.reporters} dari ${stats.summary.activeUsers} pengguna`, `${stats.summary.reporters} of ${stats.summary.activeUsers} users`)} icon={<Users size={16} />} />
            <Stat label={tr("Waktu penutupan", "Closure time")} value={tr(`${fmtNumber(stats.summary.closureDays, 1, lang)} hari`, `${fmtNumber(stats.summary.closureDays, 1, lang)} days`)} delta={stats.summary.prevClosureDays ? tr(`${fmtNumber(stats.summary.prevClosureDays, 1, lang)} hari bulan lalu`, `${fmtNumber(stats.summary.prevClosureDays, 1, lang)} days last month`) : tr("rerata", "average")} tone={stats.summary.closureDays <= stats.summary.prevClosureDays ? "good" : "warn"} icon={<Clock size={16} />} />
            <Stat label={tr("Penutupan tepat waktu", "On-time closure")} value={`${fmtNumber(stats.summary.onTime, 1, lang)}%`} delta={tr(`${stats.summary.closedInPeriod} laporan ditutup`, `${stats.summary.closedInPeriod} report${stats.summary.closedInPeriod === 1 ? "" : "s"} closed`)} tone={stats.summary.onTime >= 80 ? "good" : "warn"} icon={<FileCheck2 size={16} />} />
            <Stat label={tr("Risiko tinggi terbuka", "Open high risks")} value={stats.summary.highOpen} delta={tr(`${stats.summary.overdueOpen} lewat target`, `${stats.summary.overdueOpen} past target date`)} tone={stats.summary.overdueOpen > 0 ? "bad" : stats.summary.highOpen > 0 ? "warn" : "good"} icon={<AlertTriangle size={16} />} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title={tr("Tren laporan masuk dan ditutup", "Reports received and closed")} subtitle={tr("12 bulan terakhir", "Last 12 months")} />
              <CardBody className="pt-3">
                <MiniTrend data={stats.trend} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={tr("Risiko tinggi masih terbuka", "High risks still open")} subtitle={tr("Prioritas eskalasi", "Escalation priority")} />
              <CardBody className="pt-3">
                {stats.highOpenList.length === 0 ? (
                  <p className="text-sm text-ink-500">{tr("Tidak ada. Pertahankan.", "None. Keep it up.")}</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.highOpenList.slice(0, 5).map((r) => (
                      <li key={r.id}>
                        <Link href={`/laporan/${r.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-50">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{r.number} <span className="font-normal text-ink-500">- {r.area}</span></div>
                            <div className="text-xs text-ink-500">{L.STATUS_LABEL[r.status as Status]} - {tr(`${r.days} hari`, `${r.days} day${r.days === 1 ? "" : "s"}`)}</div>
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
            <h2 className="text-lg font-bold">{tr("Laporan terbaru", "Latest reports")}</h2>
            <Link href="/laporan" className="text-sm font-semibold text-brand-700 hover:underline">{tr("Semua laporan", "All reports")}</Link>
          </div>
          <ReportList reports={recent} emptyDesc={tr("Mulai dengan membuat laporan bahaya pertama Anda.", "Start by submitting your first hazard report.")} />
        </section>
        <section className="anim-fade-up">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold">{tr("Notifikasi", "Notifications")}</h2>
            <Link href="/notifikasi" className="text-sm font-semibold text-brand-700 hover:underline">{tr("Semua", "All")}</Link>
          </div>
          <Card>
            {notifs.length === 0 ? (
              <CardBody className="flex flex-col items-center py-8 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ILLUSTRATION.kosongNotifikasi} alt="" aria-hidden width={128} height={96} className="h-auto w-28" />
                <p className="mt-2 text-sm font-medium text-ink-700">{tr("Belum ada notifikasi", "No notifications yet")}</p>
                <p className="text-xs text-ink-500">{tr("Kabar verifikasi dan keputusan akan muncul di sini.", "Verification and decision updates will appear here.")}</p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-ink-100">
                {notifs.map((n) => {
                  const title = lang === "en" && n.titleEn != null ? n.titleEn : n.title;
                  const body = lang === "en" && n.bodyEn != null ? n.bodyEn : n.body;
                  return (
                    <li key={n.id}>
                      <Link href={n.link ?? "/notifikasi"} className={cn("block px-4 py-3 hover:bg-ink-50", !n.readAt && "bg-brand-50/40")}>
                        <div className="text-sm font-semibold text-ink-800">{title}</div>
                        {body && <div className="line-clamp-2 text-xs text-ink-500">{body}</div>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
