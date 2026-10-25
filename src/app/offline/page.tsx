import Link from "next/link";

export const metadata = { title: "Luring" };

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ikon/ilustrasi/luring.webp" alt="" aria-hidden width={240} height={180} className="h-auto w-56 anim-float" />
      <h1 className="mt-6 text-2xl font-bold">Anda sedang luring</h1>
      <p className="mt-2 max-w-sm text-ink-500">
        Laporan yang Anda buat tetap tersimpan di perangkat dan akan dikirim otomatis ketika sinyal kembali tersedia.
      </p>
      <Link href="/beranda" className="btn-primary mt-6">
        Coba lagi
      </Link>
    </main>
  );
}
