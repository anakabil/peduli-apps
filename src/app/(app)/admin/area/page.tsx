import { MapPin } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardBody, Badge } from "@/components/ui";
import { AreaForm } from "./form";

export const metadata = { title: "Area kerja" };

export default async function AreaPage() {
  await requireUser(["ADMIN", "MANAGER"]);
  const [areas, managers] = await Promise.all([
    db.area.findMany({ orderBy: { name: "asc" }, include: { manager: { select: { name: true } }, _count: { select: { reports: true, users: true } } } }),
    db.user.findMany({ where: { role: "MANAGER", status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader eyebrow="Administrasi" title="Area kerja" description="Area ditentukan otomatis dari koordinat GPS laporan: titik pusat dan radius. Laporan di luar radius ditandai untuk ditinjau. Penanggung jawab bawaan mengikuti Manager area." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3 stagger">
          {areas.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700">{a.code}</span>
                    <h3 className="font-bold">{a.name}</h3>
                    {!a.active && <Badge tone="danger">Nonaktif</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1"><MapPin size={12} /> {a.lat != null ? `${a.lat.toFixed(5)}, ${a.lng?.toFixed(5)}` : "koordinat belum diatur"} - radius {a.radiusM} m</span>
                    <span>Manager: {a.manager?.name ?? "-"}</span>
                    <span>{a._count.users} pengguna, {a._count.reports} laporan</span>
                  </div>
                </div>
                <details>
                  <summary className="btn-ghost btn-sm cursor-pointer list-none">Ubah</summary>
                  <div className="mt-3 w-full"><AreaForm area={{ id: a.id, code: a.code, name: a.name, lat: a.lat, lng: a.lng, radiusM: a.radiusM, managerId: a.managerId, active: a.active }} managers={managers.map((m) => ({ id: m.id, name: m.name ?? "-" }))} /></div>
                </details>
              </div>
            </Card>
          ))}
        </div>
        <Card className="h-fit anim-fade-up">
          <CardBody>
            <h3 className="font-bold">Tambah area</h3>
            <p className="mt-1 text-xs text-ink-500">Ambil koordinat pusat area dari Google Maps (klik kanan, salin koordinat).</p>
            <div className="mt-3"><AreaForm managers={managers.map((m) => ({ id: m.id, name: m.name ?? "-" }))} /></div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
