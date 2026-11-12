"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLangAction } from "@/app/actions/lang";
import { useLang } from "./lang-provider";
import { cn } from "@/lib/format";

/** Pilihan bahasa IND / ENG di pojok kanan atas */
export function LangSwitch({ className = "" }: { className?: string }) {
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const opt = (value: "id" | "en", label: string, title: string) => (
    <button
      type="button"
      aria-pressed={lang === value}
      title={title}
      disabled={pending}
      onClick={() =>
        lang !== value &&
        start(async () => {
          await setLangAction(value);
          router.refresh();
        })
      }
      className={cn("min-w-10 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors", lang === value ? "bg-brand-700 text-white shadow-sm" : "text-ink-500 hover:text-brand-700")}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Bahasa / Language" className={cn("inline-flex shrink-0 items-center rounded-full border border-ink-200 bg-white p-0.5", pending && "opacity-70", className)}>
      {opt("id", "IND", "Bahasa Indonesia")}
      {opt("en", "ENG", "English")}
    </div>
  );
}
