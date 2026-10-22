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
}: {
  options: readonly ChoiceOption[];
  selected: readonly string[];
  onToggle: (key: string) => void;
  multiple?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role={multiple ? "group" : "radiogroup"} aria-label={ariaLabel} className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {options.map((o) => {
        const on = selected.includes(o.key);
        const Icon = o.icon;
        return (
          <button
            key={o.key}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onToggle(o.key)}
            className={cn("choice-tile", on && "choice-tile-active")}
          >
            {Icon && (
              <span className="choice-tile-icon">
                <Icon size={17} />
              </span>
            )}
            <span className="min-w-0 flex-1 text-left">
              <span className="line-clamp-2 block text-[13px] font-semibold leading-snug">{o.label}</span>
              {o.hint && <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug text-ink-500">{o.hint}</span>}
            </span>
            <span className="choice-tile-check" aria-hidden>
              <Check size={12} strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
