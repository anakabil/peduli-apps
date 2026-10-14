import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Luring" };

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      <Image src="/brand/peduli-mark.png" alt="PEDULI" width={96} height={88} className="anim-float" />
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
