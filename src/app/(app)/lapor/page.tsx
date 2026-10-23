import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ReportForm } from "./report-form";
import { ROLE_LABEL, type Role } from "@/lib/constants";

export const metadata = { title: "Lapor bahaya" };

export default async function LaporPage() {
  const user = await requireUser();
  const [areas, personnel] = await Promise.all([
    db.area.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, lat: true, lng: true, radiusM: true } }),
    // Personel yang dapat diusulkan sebagai penanggung jawab perbaikan
    db.user.findMany({ where: { status: "ACTIVE", role: { in: ["MANAGER", "SUPERINTENDENT", "PENGAWAS"] } }, select: { id: true, name: true, jabatan: true }, orderBy: { name: "asc" } }),
  ]);
  const path = user.role === "PENGAWAS" ? "A" : "B";
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Pelaporan dari lapangan"
        title="Lapor bahaya"
        description={
          path === "A"
            ? "Diverifikasi Superintendent, lalu diputuskan Manager."
            : `Sebagai ${ROLE_LABEL[user.role as Role]}, laporan Anda langsung diteruskan ke Manager.`
        }
      />
      <ReportForm areas={areas} personnel={personnel.map((p) => ({ id: p.id, name: p.name ?? "-", jabatan: p.jabatan }))} userAreaId={user.areaId} path={path} />
    </div>
  );
}
