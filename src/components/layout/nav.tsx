"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  ShieldCheck,
  Gavel,
  Wrench,
  Gift,
  BarChart3,
  Users,
  MapPin,
  Settings,
  ScrollText,
  Bell,
  Package,
  Star,
  UserCircle,
  BookOpen,
  Network,
} from "lucide-react";
import type { Role } from "@/lib/constants";
import { cn } from "@/lib/format";
import { PeduliMark } from "@/components/brand";
import type { CurrentUser } from "@/lib/session";
import { Avatar } from "@/components/ui";

type Item = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; roles: Role[] };

const ALL: Role[] = ["ADMIN", "DIREKSI", "MANAGER", "SUPERINTENDENT", "PENGAWAS"];

export const NAV: Array<{ group: string; items: Item[] }> = [
  {
    group: "Utama",
    items: [
      { href: "/beranda", label: "Beranda", icon: LayoutDashboard, roles: ALL },
      { href: "/lapor", label: "Lapor bahaya", icon: PlusCircle, roles: ALL },
      { href: "/laporan", label: "Laporan", icon: ClipboardList, roles: ALL },
    ],
  },
  {
    group: "Tugas",
    items: [
      { href: "/verifikasi", label: "Verifikasi", icon: ShieldCheck, roles: ["SUPERINTENDENT", "ADMIN"] },
      { href: "/keputusan", label: "Keputusan", icon: Gavel, roles: ["MANAGER", "ADMIN"] },
      { href: "/tindak-lanjut", label: "Tindak lanjut", icon: Wrench, roles: ["MANAGER", "SUPERINTENDENT", "PENGAWAS", "ADMIN"] },
    ],
  },
  {
    group: "Program",
    items: [
      { href: "/poin", label: "Poin dan reward", icon: Gift, roles: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"] },
      { href: "/statistik", label: "Statistik", icon: BarChart3, roles: ["DIREKSI", "MANAGER", "ADMIN"] },
      { href: "/panduan", label: "Panduan", icon: BookOpen, roles: ALL },
    ],
  },
  {
    group: "Administrasi",
    items: [
      { href: "/admin/pengguna", label: "Pengguna", icon: Users, roles: ["ADMIN"] },
      { href: "/admin/area", label: "Area kerja", icon: MapPin, roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/akuntabilitas", label: "Akuntabilitas", icon: Network, roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/reward", label: "Katalog reward", icon: Package, roles: ["ADMIN"] },
      { href: "/admin/penukaran", label: "Penukaran poin", icon: Star, roles: ["ADMIN"] },
      { href: "/admin/pengaturan", label: "Pengaturan alur", icon: Settings, roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/audit", label: "Jejak audit", icon: ScrollText, roles: ["ADMIN"] },
    ],
  },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <div className="space-y-4">
      {NAV.map((g) => {
        const items = g.items.filter((i) => i.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={g.group}>
            <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">{g.group}</div>
            <div className="space-y-0.5">
              {items.map((i) => {
                const active = pathname === i.href || pathname.startsWith(i.href + "/");
                return (
                  <Link key={i.href} href={i.href} className={cn("nav-item", active && "nav-item-active")}>
                    <i.icon size={18} className={active ? "text-white" : "text-ink-400"} />
                    {i.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const MOBILE: Record<Role, Array<{ href: string; label: string; icon: Item["icon"] }>> = {
  PENGAWAS: [
    { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
    { href: "/laporan", label: "Laporan", icon: ClipboardList },
    { href: "/lapor", label: "Lapor", icon: PlusCircle },
    { href: "/poin", label: "Poin", icon: Gift },
    { href: "/profil", label: "Profil", icon: UserCircle },
  ],
  SUPERINTENDENT: [
    { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
    { href: "/verifikasi", label: "Verifikasi", icon: ShieldCheck },
    { href: "/lapor", label: "Lapor", icon: PlusCircle },
    { href: "/laporan", label: "Laporan", icon: ClipboardList },
    { href: "/profil", label: "Profil", icon: UserCircle },
  ],
  MANAGER: [
    { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
    { href: "/keputusan", label: "Keputusan", icon: Gavel },
    { href: "/lapor", label: "Lapor", icon: PlusCircle },
    { href: "/statistik", label: "Statistik", icon: BarChart3 },
    { href: "/profil", label: "Profil", icon: UserCircle },
  ],
  DIREKSI: [
    { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
    { href: "/statistik", label: "Statistik", icon: BarChart3 },
    { href: "/lapor", label: "Lapor", icon: PlusCircle },
    { href: "/laporan", label: "Laporan", icon: ClipboardList },
    { href: "/profil", label: "Profil", icon: UserCircle },
  ],
  ADMIN: [
    { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
    { href: "/statistik", label: "Statistik", icon: BarChart3 },
    { href: "/laporan", label: "Laporan", icon: ClipboardList },
    { href: "/admin/pengguna", label: "Admin", icon: Users },
    { href: "/profil", label: "Profil", icon: UserCircle },
  ],
};

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = MOBILE[role];
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 md:hidden glass border-t border-ink-200 pb-safe">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pt-1.5 pb-1.5">
        {items.map((i, idx) => {
          const active = pathname === i.href || pathname.startsWith(i.href + "/");
          const center = idx === 2 && i.href === "/lapor";
          if (center) {
            return (
              <Link key={i.href} href={i.href} className="flex flex-col items-center -mt-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-float anim-pulse-ring">
                  <i.icon size={26} />
                </span>
                <span className="mt-1 text-[10px] font-semibold text-brand-700">{i.label}</span>
              </Link>
            );
          }
          return (
            <Link key={i.href} href={i.href} className={cn("flex flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors", active ? "text-brand-700" : "text-ink-500")}>
              <i.icon size={21} className={cn("transition-transform", active && "scale-110")} />
              {i.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileHeader({ user, unread }: { user: CurrentUser; unread: number }) {
  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-200 glass px-4 py-2.5 md:hidden">
      <Link href="/beranda" className="flex items-center gap-2">
        <PeduliMark size={30} />
        <span className="text-sm font-extrabold tracking-wide text-brand-700">PEDULI</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/notifikasi" className="relative rounded-full p-2 text-ink-600 hover:bg-ink-100" aria-label="Notifikasi">
          <Bell size={20} />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
        </Link>
        <Link href="/profil" aria-label="Profil">
          <Avatar name={user.name} image={user.image} size={32} />
        </Link>
      </div>
    </header>
  );
}
