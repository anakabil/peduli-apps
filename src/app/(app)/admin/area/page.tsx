import { MapPin, Pencil } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, CardBody, Badge } from "@/components/ui";
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="lg:col-span-2 space-y-3 stagger">
          {areas.map((a) => (
            <Card key={a.id} className="relative p-4 md:p-5">
              <div className="min-w-0 pr-24">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs font-bold tracking-wide tabular-nums text-brand-700">{a.code}</span>
                  <h3 className="font-bold text-ink-900">{a.name}</h3>
                  {!a.active && <Badge tone="danger">Nonaktif</Badge>}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1 tabular-nums"><MapPin size={12} className="shrink-0" /> {a.lat != null ? `${a.lat.toFixed(5)}, ${a.lng?.toFixed(5)}` : "koordinat belum diatur"}, radius {a.radiusM} m</span>
                  <span>Manager: {a.manager?.name ?? "-"}</span>
                  <span className="tabular-nums">{a._count.users} pengguna, {a._count.reports} laporan</span>
                </div>
              </div>
              {/* Tombol ringkasan diletakkan di pojok kartu agar formulir yang terbuka memakai lebar penuh */}
              <details className="group">
                <summary className="btn-secondary btn-sm absolute right-4 top-4 min-h-11 cursor-pointer list-none md:right-5 md:top-5 md:min-h-0 [&::-webkit-details-marker]:hidden">
                  <Pencil size={13} />
                  <span className="group-open:hidden">Ubah</span>
                  <span className="hidden group-open:inline">Tutup</span>
                </summary>
                <div className="mt-4 border-t border-ink-100 pt-4"><AreaForm area={{ id: a.id, code: a.code, name: a.name, lat: a.lat, lng: a.lng, radiusM: a.radiusM, managerId: a.managerId, active: a.active }} managers={managers.map((m) => ({ id: m.id, name: m.name ?? "-" }))} /></div>
              </details>
            </Card>
          ))}
        </div>
        <Card className="h-fit anim-fade-up">
          <CardHeader title="Tambah area" subtitle="Ambil koordinat pusat area dari Google Maps (klik kanan, salin koordinat)." />
          <CardBody className="pt-4">
            <AreaForm managers={managers.map((m) => ({ id: m.id, name: m.name ?? "-" }))} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
