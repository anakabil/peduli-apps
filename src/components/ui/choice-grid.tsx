"use client";

import type { ComponentType } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/format";

export type ChoiceOption = { key: string; label: string; hint?: string; icon?: ComponentType<{ size?: number; className?: string }> };

/**
 * Pilihan berbentuk petak seragam: lebar sama, tinggi sama, label dibatasi dua baris.
 * Menggantikan deretan chip yang lebarnya tidak beraturan pada daftar pilihan yang panjang.
 */
export function ChoiceGrid({
  options,
  selected,
  onToggle,
  multiple = true,
  className = "",
  ariaLabel,
  layout = "stack",
}: {
  options: readonly ChoiceOption[];
  selected: readonly string[];
  onToggle: (key: string) => void;
  multiple?: boolean;
  className?: string;
  ariaLabel?: string;
  /** stack: ikon di atas label pada layar sempit (dua kolom di ponsel); row: ikon di kiri */
  layout?: "stack" | "row";
}) {
  return (
    <div role={multiple ? "group" : "radiogroup"} aria-label={ariaLabel} className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {options.map((o) => {
        const on = selected.includes(o.key);
        const Icon = o.icon;
        // Ponsel: ikon dan centang di baris atas, label selebar petak di bawahnya
        const stack = !!Icon && layout === "stack";
        return (
          <button
            key={o.key}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onToggle(o.key)}
            className={cn("choice-tile", stack && "min-h-[92px] flex-wrap content-start items-start gap-y-2 sm:min-h-[60px] sm:flex-nowrap sm:items-center", on && "choice-tile-active")}
          >
            {Icon && (
              <span className="choice-tile-icon">
                <Icon size={17} />
              </span>
            )}
            <span className={cn("min-w-0 text-left", stack ? "order-last basis-full sm:order-none sm:basis-0 sm:flex-1" : "flex-1")}>
              <span className="line-clamp-2 block text-[13px] font-semibold leading-snug">{o.label}</span>
              {o.hint && <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-ink-500">{o.hint}</span>}
            </span>
            <span className={cn("choice-tile-check", stack && "ml-auto sm:ml-0")} aria-hidden>
              <Check size={12} strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
