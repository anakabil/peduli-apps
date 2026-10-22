import Link from "next/link";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { relTime, fmtDateTime, cn } from "@/lib/format";

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
        description={items.length === 0 ? "Belum ada pemberitahuan untuk Anda." : unread ? `${unread.toLocaleString("id-ID")} notifikasi belum dibaca.` : "Semua notifikasi sudah dibaca."}
        actions={
          unread > 0 ? (
            <form action={markAll}>
              <button className="btn-secondary btn-sm min-h-11 md:min-h-0">
                <CheckCheck size={14} /> Tandai semua dibaca
              </button>
            </form>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-12 text-center anim-fade-in">
          <div className="mb-3 rounded-full bg-brand-50 p-3 text-brand-600">
            <Bell size={24} />
          </div>
          <h2 className="text-base font-bold text-ink-900">Belum ada notifikasi</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-500">Pemberitahuan verifikasi, keputusan, dan penutupan akan tampil di sini.</p>
        </div>
      ) : (
        <ul className="card divide-y divide-ink-100 overflow-hidden stagger">
          {items.map((n) => {
            const isUnread = !n.readAt;
            return (
              <li key={n.id}>
                <form action={open.bind(null, n.id, n.link)}>
                  <button className={cn("group flex min-h-16 w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ink-50 focus-visible:bg-ink-50 focus-visible:outline-none md:px-5", isUnread && "bg-brand-50/50")}>
                    {/* Penanda belum dibaca: titik kecil warna brand */}
                    <span className="flex h-5 w-2 shrink-0 items-center" aria-hidden>
                      {isUnread && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className={cn("min-w-0 text-sm leading-5", isUnread ? "font-semibold text-ink-900" : "font-medium text-ink-700")}>
                          {isUnread && <span className="sr-only">Belum dibaca: </span>}
                          {n.title}
                        </span>
                        <time dateTime={n.createdAt.toISOString()} title={fmtDateTime(n.createdAt)} className="shrink-0 whitespace-nowrap text-xs tabular-nums text-ink-500">
                          {relTime(n.createdAt)}
                        </time>
                      </span>
                      {n.body && <span className="mt-0.5 line-clamp-2 block text-sm text-ink-600">{n.body}</span>}
                    </span>
                    {n.link && <ChevronRight size={16} className="mt-0.5 shrink-0 self-center text-ink-300 transition-colors group-hover:text-ink-500" aria-hidden />}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-center text-xs text-ink-500">
        Notifikasi dikirim di dalam aplikasi.{" "}
        <Link href="/panduan" className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800">
          Pelajari alur
        </Link>
        .
      </p>
    </div>
  );
}
