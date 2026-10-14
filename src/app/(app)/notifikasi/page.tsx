import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { relTime, cn } from "@/lib/format";

export const metadata = { title: "Notifikasi" };

export default async function NotifikasiPage() {
  const user = await requireUser();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.readAt).length;

  async function markAll() {
    "use server";
    const u = await requireUser();
    await db.notification.updateMany({ where: { userId: u.id, readAt: null }, data: { readAt: new Date() } });
    revalidatePath("/notifikasi");
  }
  async function open(id: string, link: string | null) {
    "use server";
    const u = await requireUser();
    await db.notification.updateMany({ where: { id, userId: u.id }, data: { readAt: new Date() } });
    revalidatePath("/notifikasi");
    const { redirect } = await import("next/navigation");
    redirect(link ?? "/notifikasi");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Pemberitahuan"
        title="Notifikasi"
        description={unread ? `${unread} belum dibaca.` : "Semua sudah dibaca."}
        actions={
          unread > 0 ? (
            <form action={markAll}>
              <button className="btn-secondary btn-sm"><CheckCheck size={14} /> Tandai semua dibaca</button>
            </form>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={<Bell size={24} />} title="Belum ada notifikasi" description="Pemberitahuan verifikasi, keputusan, dan penutupan akan tampil di sini." />
      ) : (
        <div className="card divide-y divide-ink-100 stagger">
          {items.map((n) => (
            <form key={n.id} action={open.bind(null, n.id, n.link)}>
              <button className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50", !n.readAt && "bg-brand-50/40")}>
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-ink-200" : "bg-brand-600")} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink-800">{n.title}</span>
                  {n.body && <span className="block text-sm text-ink-600">{n.body}</span>}
                  <span className="block text-xs text-ink-400">{relTime(n.createdAt)}</span>
                </span>
              </button>
            </form>
          ))}
        </div>
      )}
      <p className="mt-4 text-center text-xs text-ink-400">
        Notifikasi dikirim di dalam aplikasi. <Link href="/panduan" className="underline">Pelajari alur</Link>.
      </p>
    </div>
  );
}
