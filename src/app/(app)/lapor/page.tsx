import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ReportForm } from "./report-form";
import { labels, type Role } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Lapor bahaya", "Report a hazard") };
}

export default async function LaporPage() {
  const user = await requireUser();
  const { lang, tr } = await getTr();
  const L = labels(lang);
  const [areas, personnel] = await Promise.all([
    db.area.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, lat: true, lng: true, radiusM: true } }),
    // Personel yang dapat diusulkan sebagai penanggung jawab perbaikan
    db.user.findMany({ where: { status: "ACTIVE", role: { in: ["MANAGER", "SUPERINTENDENT", "PENGAWAS"] } }, select: { id: true, name: true, jabatan: true }, orderBy: { name: "asc" } }),
  ]);
  const path = user.role === "PENGAWAS" ? "A" : "B";
  const roleLabel = L.ROLE_LABEL[user.role as Role];
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={tr("Pelaporan dari lapangan", "Field reporting")}
        title={tr("Lapor bahaya", "Report a hazard")}
        description={
          path === "A"
            ? tr("Diverifikasi Superintendent, lalu diputuskan Manager.", "Verified by the Superintendent, then decided by the Manager.")
            : tr(`Sebagai ${roleLabel}, laporan Anda langsung diteruskan ke Manager.`, `As ${roleLabel}, your report goes directly to the Manager.`)
        }
      />
      <ReportForm areas={areas} personnel={personnel.map((p) => ({ id: p.id, name: p.name ?? "-", jabatan: p.jabatan }))} userAreaId={user.areaId} path={path} />
    </div>
  );
}
