import Link from "next/link";
import type { ReactNode } from "react";
import { PeduliLogo, GysLogo } from "@/components/brand";
import { Sidebar, BottomNav, MobileHeader } from "./nav";
import { OnlineBanner } from "@/components/pwa/online-banner";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { OfflineSync } from "@/components/pwa/offline-sync";
import { TopBar } from "./top-bar";
import type { CurrentUser } from "@/lib/session";
import type { Role } from "@/lib/constants";

export function AppShell({ user, unread, children }: { user: CurrentUser; unread: number; children: ReactNode }) {
  const role = user.role as Role;
  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar desktop */}
      <aside className="no-print hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-ink-200 bg-white/80 glass sticky top-0 h-dvh">
        <div className="px-5 pt-6 pb-5">
          <Link href="/beranda" className="inline-flex items-center" aria-label="Beranda PEDULI">
            <PeduliLogo height={46} />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          <Sidebar role={role} />
        </nav>
        <div className="flex items-center gap-2.5 border-t border-ink-100 px-5 py-3.5">
          <GysLogo size={26} className="rounded" />
          <span className="truncate text-xs font-medium text-ink-600">PT. Garuda Yamato Steel</span>
        </div>
      </aside>

      {/* Konten */}
      <div className="flex min-h-dvh flex-1 flex-col min-w-0">
        <OnlineBanner />
        <MobileHeader user={user} unread={unread} />
        <TopBar user={user} unread={unread} />
        <main className="flex-1 px-4 py-5 md:px-8 md:py-8 max-w-7xl w-full mx-auto">{children}</main>
        <footer className="no-print border-t border-ink-100 px-4 pt-4 pb-28 text-center text-xs text-ink-500 md:px-8 md:pb-4">
          PEDULI Apps, Pelaporan Bahaya dan Upaya Pengendalian. Developed by Nusa Safety
        </footer>
        <BottomNav role={role} />
      </div>
      <InstallPrompt />
      <OfflineSync />
    </div>
  );
}
