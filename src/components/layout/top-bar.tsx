import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import type { CurrentUser } from "@/lib/session";
import { signOut } from "@/auth";
import { InstallButton } from "@/components/pwa/install-prompt";

export function TopBar({ user, unread }: { user: CurrentUser; unread: number }) {
  return (
    <header className="no-print hidden md:flex items-center justify-end gap-3 border-b border-ink-100 bg-white/60 glass px-8 py-3 sticky top-0 z-30">
      <InstallButton />
      <Link href="/notifikasi" className="relative rounded-full p-2 text-ink-600 hover:bg-ink-100 transition-colors" aria-label="Notifikasi">
        <Bell size={20} />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </Link>
      <Link href="/profil" className="flex items-center gap-3 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-4 hover:border-brand-300 transition-colors">
        <Avatar name={user.name} image={user.image} size={32} />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink-800">{user.name}</div>
          <div className="text-[11px] text-ink-500">{ROLE_LABEL[user.role as Role]}</div>
        </div>
      </Link>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/masuk" });
        }}
      >
        <button className="btn-ghost btn-sm" title="Keluar">
          <LogOut size={16} /> Keluar
        </button>
      </form>
    </header>
  );
}
