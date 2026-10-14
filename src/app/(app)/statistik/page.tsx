import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { computeStats, monthPeriod } from "@/lib/stats";
import { jktDate, jktParts } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { StatsDashboard, type SerializedStats } from "./dashboard";
import { PeriodPicker } from "./period-picker";
import { COMPANY_NAME } from "@/lib/constants";

export const metadata = { title: "Statistik" };

function parseYmd(v: string) {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? jktDate(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function parsePeriod(sp: Record<string, string | undefined>) {
  const now = jktParts();
  if (sp.dari && sp.sampai) {
    const from = parseYmd(sp.dari);
    const toDay = parseYmd(sp.sampai);
    if (from && toDay && from <= toDay) {
      const to = new Date(toDay.getTime() + 86400000);
      return { period: { from, to }, label: `${sp.dari} s.d. ${sp.sampai}`, mode: "rentang" as const };
    }
  }
  if (sp.tahun && !sp.bulan) {
    const y = parseInt(sp.tahun, 10);
    if (y > 2000 && y < 2200) return { period: { from: jktDate(y, 0, 1), to: jktDate(y + 1, 0, 1) }, label: `Tahun ${y}`, mode: "tahun" as const };
  }
  const m = /^\d{4}-\d{2}$/.test(sp.bulan ?? "") ? sp.bulan! : `${now.y}-${String(now.m0 + 1).padStart(2, "0")}`;
  const [y, mo] = m.split("-").map(Number);
  const period = monthPeriod(y, mo - 1);
  return { period, label: new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "long", year: "numeric" }).format(period.from), mode: "bulan" as const };
}

export default async function StatistikPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser(["DIREKSI", "MANAGER", "ADMIN"]);
  const sp = await searchParams;
  const { period, label, mode } = parsePeriod(sp);
  const areaId = sp.area || null;
  const [stats, areas] = await Promise.all([computeStats(period, { areaId }), db.area.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })]);
  const serialized = JSON.parse(JSON.stringify(stats)) as SerializedStats;
  const canExport = user.role === "ADMIN" || user.role === "DIREKSI" || user.role === "MANAGER";
  const areaName = areaId ? areas.find((a) => a.id === areaId)?.name ?? null : null;

  return (
    <div>
      <PageHeader eyebrow={user.role === "DIREKSI" ? "Dashboard Direksi" : "Dashboard program"} title="Statistik PEDULI" description={`Kondisi aktual program pelaporan bahaya ${COMPANY_NAME}. Periode ${label}${areaName ? `, area ${areaName}` : ", seluruh area"}.`} />
      <PeriodPicker areas={areas} mode={mode} />
      <StatsDashboard stats={serialized} periodLabel={label} areaName={areaName} canExport={canExport} preparedBy={user.name ?? ""} />
    </div>
  );
}
