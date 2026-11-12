import { MapPin, Pencil } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { AreaForm } from "./form";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Area kerja", "Work areas") };
}

export default async function AreaPage() {
  await requireUser(["ADMIN", "MANAGER"]);
  const { tr } = await getTr();
  const [areas, managers] = await Promise.all([
    db.area.findMany({ orderBy: { name: "asc" }, include: { manager: { select: { name: true } }, _count: { select: { reports: true, users: true } } } }),
    db.user.findMany({ where: { role: "MANAGER", status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  // Lingkaran area lain ditampilkan samar pada peta agar radius tidak saling tumpang tindih
  const others = areas.filter((a) => a.lat != null && a.lng != null).map((a) => ({ id: a.id, name: a.name, lat: a.lat!, lng: a.lng!, radiusM: a.radiusM }));
  const center = others[0] ? { lat: others[0].lat, lng: others[0].lng } : { lat: -5.9955, lng: 106.0152 };
  const mgr = managers.map((m) => ({ id: m.id, name: m.name ?? "-" }));
  return (
    <div>
      <PageHeader
        eyebrow={tr("Administrasi", "Administration")}
        title={tr("Area kerja", "Work areas")}
        description={tr(
          "Area ditentukan otomatis dari koordinat GPS laporan: titik pusat dan radius. Laporan di luar radius ditandai untuk ditinjau. Penanggung jawab bawaan mengikuti Manager area.",
          "The area is determined automatically from the report's GPS coordinates: a centre point and a radius. Reports outside the radius are flagged for review. The default person in charge is the area Manager.",
        )}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="lg:col-span-2 space-y-3 stagger">
          {areas.map((a) => (
            <Card key={a.id} className="relative p-4 md:p-5">
              <div className="min-w-0 pr-24">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs font-bold tracking-wide tabular-nums text-brand-700">{a.code}</span>
                  <h3 className="font-bold text-ink-900">{a.name}</h3>
                  {!a.active && <Badge tone="danger">{tr("Nonaktif", "Inactive")}</Badge>}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1 tabular-nums"><MapPin size={12} className="shrink-0" /> {a.lat != null ? `${a.lat.toFixed(5)}, ${a.lng?.toFixed(5)}` : tr("koordinat belum diatur", "coordinates not set")}, radius {a.radiusM} m</span>
                  <span>Manager: {a.manager?.name ?? "-"}</span>
                  <span className="tabular-nums">
                    {tr(`${a._count.users} pengguna, ${a._count.reports} laporan`, `${a._count.users} user${a._count.users === 1 ? "" : "s"}, ${a._count.reports} report${a._count.reports === 1 ? "" : "s"}`)}
                  </span>
                </div>
              </div>
              {/* Tombol ringkasan diletakkan di pojok kartu agar formulir yang terbuka memakai lebar penuh */}
              <details className="group">
                <summary className="btn-secondary btn-sm absolute right-4 top-4 min-h-11 cursor-pointer list-none md:right-5 md:top-5 md:min-h-0 [&::-webkit-details-marker]:hidden">
                  <Pencil size={13} />
                  <span className="group-open:hidden">{tr("Ubah", "Edit")}</span>
                  <span className="hidden group-open:inline">{tr("Tutup", "Close")}</span>
                </summary>
                <div className="mt-4 border-t border-ink-100 pt-4"><AreaForm area={{ id: a.id, code: a.code, name: a.name, lat: a.lat, lng: a.lng, radiusM: a.radiusM, managerId: a.managerId, active: a.active }} managers={mgr} center={center} others={others} /></div>
              </details>
            </Card>
          ))}
        </div>
        <Card className="h-fit anim-fade-up">
          <CardHeader title={tr("Tambah area", "Add area")} subtitle={tr("Tetapkan titik pusat pada peta.", "Set the centre point on the map.")} />
          <CardBody className="pt-4">
            <AreaForm managers={mgr} center={center} others={others} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
