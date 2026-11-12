import Link from "next/link";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Luring", "Offline") };
}

export default async function OfflinePage() {
  const { tr } = await getTr();
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ikon/ilustrasi/luring.webp" alt="" aria-hidden width={240} height={180} className="h-auto w-56 anim-float" />
      <h1 className="mt-6 text-2xl font-bold">{tr("Anda sedang luring", "You are offline")}</h1>
      <p className="mt-2 max-w-sm text-ink-500">
        {tr("Laporan yang Anda buat tetap tersimpan di perangkat dan akan dikirim otomatis ketika sinyal kembali tersedia.", "Reports you create stay saved on this device and will be sent automatically when the connection returns.")}
      </p>
      <Link href="/beranda" className="btn-primary mt-6">
        {tr("Coba lagi", "Try again")}
      </Link>
    </main>
  );
}
