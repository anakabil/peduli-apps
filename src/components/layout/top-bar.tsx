import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui";
import { labels, type Role } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";
import { LangSwitch } from "@/components/i18n/lang-switch";
import type { CurrentUser } from "@/lib/session";
import { logoutAction } from "@/app/actions/session";
import { PushEndpointInput } from "@/components/pwa/push-setup";
import { InstallButton } from "@/components/pwa/install-prompt";

export async function TopBar({ user, unread }: { user: CurrentUser; unread: number }) {
  const { lang, tr } = await getTr();
  return (
    <header className="no-print hidden md:flex items-center justify-end gap-3 border-b border-ink-100 bg-white/60 glass px-8 py-3 sticky top-0 z-30">
      <InstallButton />
      <Link href="/notifikasi" className="relative rounded-full p-2 text-ink-600 hover:bg-ink-100 transition-colors" aria-label={tr("Notifikasi", "Notifications")}>
        <Bell size={20} />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </Link>
      <Link href="/profil" className="flex items-center gap-3 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-4 hover:border-brand-300 transition-colors">
        <Avatar name={user.name} image={user.image} size={32} />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink-800">{user.name}</div>
          <div className="text-[11px] text-ink-500">{labels(lang).ROLE_LABEL[user.role as Role]}</div>
        </div>
      </Link>
      <form action={logoutAction}>
        <PushEndpointInput />
        <button className="btn-ghost btn-sm" title={tr("Keluar", "Sign out")}>
          <LogOut size={16} /> {tr("Keluar", "Sign out")}
        </button>
      </form>
      <LangSwitch />
    </header>
  );
}
