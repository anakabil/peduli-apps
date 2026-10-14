import Link from "next/link";
import type { ReactNode } from "react";
import { PeduliLogo, GysLogo, Credit } from "@/components/brand";
import { Sidebar, BottomNav, MobileHeader } from "./nav";
import { OnlineBanner } from "@/components/pwa/online-banner";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { OfflineSync } from "@/components/pwa/offline-sync";
import { TopBar } from "./top-bar";
import type { CurrentUser } from "@/lib/session";
import { ROLE_LABEL, type Role } from "@/lib/constants";

export function AppShell({ user, unread, children }: { user: CurrentUser; unread: number; children: ReactNode }) {
  const role = user.role as Role;
  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar desktop */}
      <aside className="no-print hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-ink-200 bg-white/80 glass sticky top-0 h-dvh">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <Link href="/beranda" className="flex items-center">
            <PeduliLogo height={38} />
          </Link>
        </div>
        <div className="mx-5 mb-3 flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50/70 px-3 py-2">
          <GysLogo size={34} className="rounded-md" />
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-ink-800">PT. Garuda Yamato Steel</div>
            <div className="truncate text-[11px] text-ink-500">Program pelaporan bahaya</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          <Sidebar role={role} />
        </nav>
        <div className="border-t border-ink-100 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Masuk sebagai</div>
          <div className="mt-0.5 truncate text-sm font-semibold text-ink-800">{user.name}</div>
          <div className="truncate text-xs text-ink-500">{ROLE_LABEL[role]}{user.jabatan ? ` - ${user.jabatan}` : ""}</div>
          <Credit className="mt-4 items-start text-left" />
        </div>
      </aside>

      {/* Konten */}
      <div className="flex min-h-dvh flex-1 flex-col min-w-0">
        <OnlineBanner />
        <MobileHeader user={user} unread={unread} />
        <TopBar user={user} unread={unread} />
        <main className="flex-1 px-4 py-5 pb-28 md:px-8 md:py-8 md:pb-10 max-w-7xl w-full mx-auto">{children}</main>
        <footer className="no-print hidden md:block border-t border-ink-100 px-8 py-4 text-center text-xs text-ink-400">
          PEDULI Apps - Pelaporan Bahaya dan Upaya Pengendalian - Developed by Nusa Safety
        </footer>
        <BottomNav role={role} />
      </div>
      <InstallPrompt />
      <OfflineSync />
    </div>
  );
}
