import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, CardBody, Badge } from "@/components/ui";
import { RewardForm } from "./form";

export const metadata = { title: "Katalog reward" };

export default async function RewardAdminPage() {
  await requireUser(["ADMIN"]);
  const rewards = await db.reward.findMany({ orderBy: [{ active: "desc" }, { pointsCost: "asc" }], include: { _count: { select: { redemptions: true } } } });
  return (
    <div>
      <PageHeader eyebrow="Administrasi" title="Katalog reward" description="Hadiah ditetapkan tim pengelola sesuai anggaran dan kebijakan. Nilai poin dan stok dapat disesuaikan kapan saja." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3 stagger">
          {rewards.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{r.name}</h3>
                    <Badge tone="warn">{r.pointsCost} poin</Badge>
                    <Badge tone="neutral">{r.tier === "AWAL" ? "Tingkat awal" : r.tier === "MENENGAH" ? "Tingkat menengah" : "Tingkat lanjut"}</Badge>
                    {!r.active && <Badge tone="danger">Nonaktif</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-ink-500">{r.description} - stok {r.stock} - {r._count.redemptions} penukaran</div>
                </div>
                <details>
                  <summary className="btn-ghost btn-sm cursor-pointer list-none">Ubah</summary>
                  <div className="mt-3"><RewardForm reward={{ id: r.id, name: r.name, description: r.description, pointsCost: r.pointsCost, stock: r.stock, tier: r.tier, icon: r.icon, active: r.active }} /></div>
                </details>
              </div>
            </Card>
          ))}
        </div>
        <Card className="h-fit anim-fade-up">
          <CardBody>
            <h3 className="font-bold">Tambah hadiah</h3>
            <div className="mt-3"><RewardForm /></div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
