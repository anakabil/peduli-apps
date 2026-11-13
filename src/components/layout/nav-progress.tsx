"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Bilah progres tipis di atas layar yang muncul seketika saat tautan internal diketuk,
 * sehingga pengguna tahu aplikasi sedang memuat dan tidak mengetuk berulang kali.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Halaman baru sudah tampil: selesaikan bilah lalu sembunyikan
  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
    const t = setTimeout(() => setState((s) => (s === "done" ? "idle" : s)), 350);
    return () => clearTimeout(t);
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setState("loading");
      if (timer.current) clearTimeout(timer.current);
      // Pengaman: jangan tampil selamanya bila navigasi dibatalkan
      timer.current = setTimeout(() => setState("idle"), 15000);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (state === "idle") return null;
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div
        className="h-full bg-brand-600 shadow-[0_0_8px_rgba(0,96,66,0.5)]"
        style={{
          width: state === "done" ? "100%" : "85%",
          opacity: state === "done" ? 0 : 1,
          transition: state === "done" ? "width 150ms ease-out, opacity 300ms ease 150ms" : "width 8s cubic-bezier(0.1, 0.7, 0.2, 1)",
          animation: state === "loading" ? "nav-progress-start 8s cubic-bezier(0.1, 0.7, 0.2, 1)" : undefined,
        }}
      />
    </div>
  );
}
