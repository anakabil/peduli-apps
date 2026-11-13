"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Home } from "lucide-react";
import { useTr } from "@/components/i18n/lang-provider";

/** Ditampilkan bila halaman gagal dimuat (misalnya basis data sedang sibuk), dengan tombol coba lagi */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const tr = useTr();
  const router = useRouter();
  const [pending, start] = useTransition();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-md py-12 text-center anim-fade-up" role="alert">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber/15 text-[#8a6a0a]">
        <RefreshCw size={24} />
      </div>
      <h1 className="mt-4 text-xl font-bold text-ink-900">{tr("Halaman belum berhasil dimuat", "The page could not be loaded")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        {tr(
          "Server sedang sibuk atau koneksi terputus sebentar. Data Anda aman. Silakan coba lagi dalam beberapa detik.",
          "The server is busy or the connection dropped briefly. Your data is safe. Please try again in a few seconds.",
        )}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          className="btn-primary"
          disabled={pending}
          onClick={() =>
            start(() => {
              router.refresh();
              reset();
            })
          }
        >
          <RefreshCw size={16} className={pending ? "animate-spin" : ""} /> {tr("Coba lagi", "Try again")}
        </button>
        <Link href="/beranda" className="btn-secondary">
          <Home size={16} /> {tr("Ke Beranda", "Go to Home")}
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-[11px] text-ink-400">{tr("Kode", "Code")}: {error.digest}</p>}
    </div>
  );
}
