import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import { DEVELOPER_CREDIT, COMPANY_NAME } from "@/lib/constants";

export function PeduliLogo({ height = 40, className = "" }: { height?: number; className?: string }) {
  const width = Math.round(height * (1373 / 442));
  return <Image src="/brand/peduli-logo-compact.png" alt="PEDULI Apps" width={width} height={height} className={className} priority />;
}

/** Tombol kecil "i" menuju halaman Tentang */
export function AboutButton({ className = "" }: { className?: string }) {
  return (
    <Link href="/tentang" aria-label="Tentang PEDULI / About PEDULI" title="Tentang PEDULI / About PEDULI" className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700 ${className}`}>
      <Info size={15} />
    </Link>
  );
}

export function PeduliMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <Image src="/brand/peduli-mark.png" alt="PEDULI" width={size} height={Math.round(size * (436 / 493))} className={className} priority />;
}

export function GysLogo({ size = 44, className = "" }: { size?: number; className?: string }) {
  return <Image src="/brand/gys-logo.png" alt={COMPANY_NAME} width={size} height={size} className={className} />;
}

export function Credit({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 text-center text-[11px] text-ink-400 ${className}`}>
      <div>
        &copy; {new Date().getFullYear()} {COMPANY_NAME}
      </div>
      <div className="font-medium tracking-wide">{DEVELOPER_CREDIT}</div>
    </div>
  );
}
