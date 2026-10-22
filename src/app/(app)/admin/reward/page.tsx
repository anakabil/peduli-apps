import { Pencil, Umbrella, CupSoda, Footprints, Ticket, Package } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { RewardForm } from "./form";

export const metadata = { title: "Katalog reward" };

// Sama dengan pemetaan ikon di halaman /poin
const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = { Umbrella, CupSoda, Footprints, Ticket, Package };
const TIER_LABEL: Record<string, string> = { AWAL: "Tingkat awal", MENENGAH: "Tingkat menengah", LANJUT: "Tingkat lanjut" };

export default async function RewardAdminPage() {
  await requireUser(["ADMIN"]);
  const rewards = await db.reward.findMany({ orderBy: [{ active: "desc" }, { pointsCost: "asc" }], include: { _count: { select: { redemptions: true } } } });
  return (
    <div>
      <PageHeader eyebrow="Administrasi" title="Katalog reward" description="Hadiah ditetapkan tim pengelola sesuai anggaran dan kebijakan. Nilai poin dan stok dapat disesuaikan kapan saja." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:col-span-2 stagger">
          {rewards.map((r) => {
            const Icon = ICONS[r.icon ?? "Package"] ?? Package;
            return (
              // Kartu yang sedang diubah melebar penuh agar formulir lega
              <Card key={r.id} className={`relative flex flex-col p-4 md:p-5 sm:has-[details[open]]:col-span-2 ${!r.active ? "bg-ink-50" : ""}`}>
                <div className="flex items-start gap-3 pr-24">
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${r.active ? "bg-brand-50 text-brand-700" : "bg-ink-100 text-ink-500"}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink-900">{r.name}</h3>
                    {r.description && <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{r.description}</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="warn" className="tabular-nums">{r.pointsCost} poin</Badge>
                  <Badge tone="neutral">{TIER_LABEL[r.tier] ?? r.tier}</Badge>
                  {!r.active && <Badge tone="danger">Nonaktif</Badge>}
                </div>
                <div className="mt-auto pt-3">
                  <div className="flex gap-4 border-t border-ink-100 pt-3 text-xs text-ink-500">
                    <span>Stok <span className="font-semibold tabular-nums text-ink-800">{r.stock}</span></span>
                    <span><span className="font-semibold tabular-nums text-ink-800">{r._count.redemptions}</span> penukaran</span>
                  </div>
                </div>
                <details className="group">
                  <summary className="btn-secondary btn-sm absolute right-4 top-4 min-h-11 cursor-pointer list-none md:right-5 md:top-5 md:min-h-0 [&::-webkit-details-marker]:hidden">
                    <Pencil size={13} />
                    <span className="group-open:hidden">Ubah</span>
                    <span className="hidden group-open:inline">Tutup</span>
                  </summary>
                  <div className="mt-4 border-t border-ink-100 pt-4"><RewardForm reward={{ id: r.id, name: r.name, description: r.description, pointsCost: r.pointsCost, stock: r.stock, tier: r.tier, icon: r.icon, active: r.active }} /></div>
                </details>
              </Card>
            );
          })}
        </div>
        <Card className="h-fit anim-fade-up">
          <CardHeader title="Tambah hadiah" subtitle="Isi nama, nilai poin, dan stok awal hadiah." />
          <CardBody className="pt-4">
            <RewardForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
