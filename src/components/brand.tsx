import Image from "next/image";
import { DEVELOPER_CREDIT, COMPANY_NAME } from "@/lib/constants";

export function PeduliLogo({ height = 40, className = "" }: { height?: number; className?: string }) {
  const width = Math.round(height * (1373 / 569));
  return <Image src="/brand/peduli-logo.png" alt="PEDULI Apps" width={width} height={height} className={className} priority />;
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
