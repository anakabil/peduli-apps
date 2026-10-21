import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ReportForm } from "./report-form";
import { ROLE_LABEL, type Role } from "@/lib/constants";

export const metadata = { title: "Lapor bahaya" };

export default async function LaporPage() {
  const user = await requireUser();
  const areas = await db.area.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, code: true } });
  const path = user.role === "PENGAWAS" ? "A" : "B";
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Kartu STOP (DuPont)"
        title="Lapor bahaya: kartu STOP"
        description={
          path === "A"
            ? "Laporan Anda akan diverifikasi Superintendent lebih dahulu, lalu diputuskan Manager."
            : `Sebagai ${ROLE_LABEL[user.role as Role]}, laporan Anda langsung diteruskan ke Manager tanpa verifikasi Superintendent.`
        }
      />
      <ReportForm areas={areas} userAreaId={user.areaId} path={path} />
    </div>
  );
}
