import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Card({ children, className = "", hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={cn("card", hover && "card-hover", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action, className = "" }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5", className)}>
      <div>
        <h3 className="text-base font-bold text-ink-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 py-5", className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between anim-fade-up">
      <div>
        {eyebrow && <div className="section-title mb-1.5">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-500 md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 no-print">{actions}</div>}
    </div>
  );
}

export type Tone = "neutral" | "info" | "warn" | "success" | "danger" | "brand";
export function Badge({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>;
}

export function Stat({ label, value, delta, tone = "neutral", icon, hint }: { label: string; value: ReactNode; delta?: ReactNode; tone?: "neutral" | "good" | "bad" | "warn"; icon?: ReactNode; hint?: string }) {
  const deltaColor = tone === "good" ? "text-brand-600" : tone === "bad" ? "text-red" : tone === "warn" ? "text-[#8a6a0a]" : "text-ink-500";
  return (
    <div className="card flex flex-col p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-medium leading-snug text-ink-600">{label}</div>
        {icon && <div className="rounded-lg bg-brand-50 p-1.5 text-brand-600">{icon}</div>}
      </div>
      <div className="mt-2 whitespace-nowrap text-2xl font-bold tracking-tight tabular-nums text-ink-900 md:text-[1.75rem]">{value}</div>
      {delta && <div className={cn("mt-1 text-xs font-medium", deltaColor)}>{delta}</div>}
      {hint && <div className="mt-auto pt-1 text-xs text-ink-500">{hint}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center anim-fade-in">
      {icon && <div className="mb-3 rounded-2xl bg-brand-50 p-3 text-brand-600">{icon}</div>}
      <h3 className="text-base font-bold text-ink-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ label, children, help, required }: { label: string; children: ReactNode; help?: string; required?: boolean }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-red">*</span>}
      </label>
      {children}
      {help && <p className="help">{help}</p>}
    </div>
  );
}

export function Avatar({ name, image, size = 36 }: { name?: string | null; image?: string | null; size?: number }) {
  const init = (name ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? ""} width={size} height={size} className="rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} referrerPolicy="no-referrer" />;
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-brand-700 font-bold text-white ring-2 ring-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {init}
    </div>
  );
}

export function Alert({ tone = "info", title, children }: { tone?: "info" | "warn" | "danger" | "success"; title?: string; children?: ReactNode }) {
  const styles = {
    info: "bg-blue/5 border-blue/20 text-ink-800",
    warn: "bg-amber/10 border-amber/30 text-ink-800",
    danger: "bg-red/5 border-red/20 text-ink-800",
    success: "bg-brand-50 border-brand-200 text-ink-800",
  }[tone];
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", styles)}>
      {title && <div className="font-semibold">{title}</div>}
      {children && <div className={title ? "mt-0.5 text-ink-600" : ""}>{children}</div>}
    </div>
  );
}

export function LinkButton({ href, children, variant = "primary", className = "" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  return (
    <Link href={href} className={cn(`btn-${variant}`, className)}>
      {children}
    </Link>
  );
}

/** Pasangan label dan nilai; hideEmpty menyembunyikan butir yang belum berisi */
export function KeyValue({ items, hideEmpty = false }: { items: Array<{ k: string; v: ReactNode }>; hideEmpty?: boolean }) {
  const list = hideEmpty ? items.filter((it) => it.v != null && it.v !== "" && it.v !== "-") : items;
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {list.map((it) => (
        <div key={it.k} className="min-w-0">
          <dt className="text-xs font-medium text-ink-500">{it.k}</dt>
          <dd className="mt-0.5 text-sm text-ink-800 break-words">{it.v ?? "-"}</dd>
        </div>
      ))}
    </dl>
  );
}
