import { Badge } from "@/components/ui";
import { STATUS_LABEL, STATUS_TONE, RISK_LABEL, RISK_COLOR, CATEGORY_LABEL, type Status, type Risk, type Category } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const s = status as Status;
  return <Badge tone={STATUS_TONE[s] ?? "neutral"}>{STATUS_LABEL[s] ?? status}</Badge>;
}

// Teks gelap di atas latar berwarna lembut: kontras terbaca, tidak mencolok
const RISK_INK: Record<Risk, string> = { RENDAH: "#00573c", SEDANG: "#7a5c06", TINGGI: "#9a4a0c", EKSTREM: "#a3262a" };

export function RiskBadge({ risk, className = "" }: { risk: string; className?: string }) {
  const r = risk as Risk;
  const c = RISK_COLOR[r] ?? "#888888";
  return (
    <span className={`badge ${className}`} style={{ background: `${c}1f`, color: RISK_INK[r] ?? "#33423b" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {RISK_LABEL[r] ?? risk}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return <Badge tone="neutral">{CATEGORY_LABEL[category as Category] ?? category}</Badge>;
}
