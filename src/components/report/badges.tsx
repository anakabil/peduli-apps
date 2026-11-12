"use client";

import { Badge } from "@/components/ui";
import { labels, STATUS_TONE, RISK_COLOR, type Status, type Risk, type Category } from "@/lib/constants";
import { CATEGORY_IMG } from "@/lib/icons";
import { useLang } from "@/components/i18n/lang-provider";

export function StatusBadge({ status }: { status: string }) {
  const L = labels(useLang());
  const s = status as Status;
  return <Badge tone={STATUS_TONE[s] ?? "neutral"}>{L.STATUS_LABEL[s] ?? status}</Badge>;
}

// Teks gelap di atas latar berwarna lembut: kontras terbaca, tidak mencolok
const RISK_INK: Record<Risk, string> = { RENDAH: "#00573c", SEDANG: "#7a5c06", TINGGI: "#9a4a0c", EKSTREM: "#a3262a" };

export function RiskBadge({ risk, className = "" }: { risk: string; className?: string }) {
  const L = labels(useLang());
  const r = risk as Risk;
  const c = RISK_COLOR[r] ?? "#888888";
  return (
    <span className={`badge ${className}`} style={{ background: `${c}1f`, color: RISK_INK[r] ?? "#33423b" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {L.RISK_LABEL[r] ?? risk}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const L = labels(useLang());
  const img = CATEGORY_IMG[category as Category];
  return (
    <Badge tone="neutral" className="gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {img && <img src={img} alt="" aria-hidden width={16} height={16} className="-my-0.5 size-4" />}
      {L.CATEGORY_LABEL[category as Category] ?? category}
    </Badge>
  );
}
