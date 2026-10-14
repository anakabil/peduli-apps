import { Badge } from "@/components/ui";
import { STATUS_LABEL, STATUS_TONE, RISK_LABEL, RISK_COLOR, CATEGORY_LABEL, type Status, type Risk, type Category } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const s = status as Status;
  return <Badge tone={STATUS_TONE[s] ?? "neutral"}>{STATUS_LABEL[s] ?? status}</Badge>;
}

export function RiskBadge({ risk, className = "" }: { risk: string; className?: string }) {
  const r = risk as Risk;
  return (
    <span className={`badge text-white ${className}`} style={{ background: RISK_COLOR[r] ?? "#888" }}>
      {RISK_LABEL[r] ?? risk}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return <Badge tone="neutral">{CATEGORY_LABEL[category as Category] ?? category}</Badge>;
}
