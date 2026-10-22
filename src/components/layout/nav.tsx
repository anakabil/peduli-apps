"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  Menu,
  X,
  ChevronRight,
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
    <div className="space-y-5">
      {NAV.map((g) => {
        const items = g.items.filter((i) => i.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={g.group}>
            <div className="px-3 pb-1.5 text-xs font-medium text-ink-500">{g.group}</div>
            <div className="space-y-0.5">
              {items.map((i) => {
                const active = pathname === i.href || pathname.startsWith(i.href + "/");
                return (
                  <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("nav-item", active && "nav-item-active")}>
                    <i.icon size={18} className={active ? "text-brand-700" : "text-ink-400"} />
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

type MobileItem = { href: string; label: string; icon: Item["icon"] };

// Empat pintasan per peran; menu lengkap (termasuk administrasi) dibuka lewat tombol Menu
const MOBILE: Record<Role, MobileItem[]> = {
  PENGAWAS: [
    { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
    { href: "/laporan", label: "Laporan", icon: ClipboardList },
    { href: "/lapor", label: "Lapor", icon: PlusCircle },
    { href: "/poin", label: "Poin", icon: Gift },
  ],
  SUPERINTENDENT: [
    { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
    { href: "/verifikasi", label: "Verifikasi", icon: ShieldCheck },
    { href: "/lapor", label: "Lapor", icon: PlusCircle },
    { href: "/tindak-lanjut", label: "Tindak lanjut", icon: Wrench },
  ],
  MANAGER: [
    { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
    { href: "/keputusan", label: "Keputusan", icon: Gavel },
    { href: "/lapor", label: "Lapor", icon: PlusCircle },
    { href: "/tindak-lanjut", label: "Tindak lanjut", icon: Wrench },
  ],
  DIREKSI: [
    { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
    { href: "/statistik", label: "Statistik", icon: BarChart3 },
    { href: "/lapor", label: "Lapor", icon: PlusCircle },
    { href: "/laporan", label: "Laporan", icon: ClipboardList },
  ],
  ADMIN: [
    { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
    { href: "/laporan", label: "Laporan", icon: ClipboardList },
    { href: "/lapor", label: "Lapor", icon: PlusCircle },
    { href: "/statistik", label: "Statistik", icon: BarChart3 },
  ],
};

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = MOBILE[role];
  const menuActive = !items.some((i) => isActive(pathname, i.href));

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const cell = (active: boolean) => cn("relative flex h-14 flex-col items-center justify-end gap-1 pb-1.5 text-[11px] font-medium transition-colors", active ? "text-brand-700" : "text-ink-500");
  const bar = (active: boolean) => active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-brand-700" />;

  return (
    <>
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 backdrop-blur-md md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto grid max-w-md grid-cols-5 px-1">
          {items.map((i) => {
            const active = isActive(pathname, i.href);
            if (i.href === "/lapor") {
              return (
                <Link key={i.href} href={i.href} className={cell(active)} aria-current={active ? "page" : undefined}>
                  <span className="absolute -top-4 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-[0_8px_20px_-8px_rgba(0,96,66,0.6)] ring-4 ring-white">
                    <i.icon size={22} />
                  </span>
                  <span className={active ? "font-semibold" : ""}>{i.label}</span>
                </Link>
              );
            }
            return (
              <Link key={i.href} href={i.href} className={cell(active)} aria-current={active ? "page" : undefined}>
                {bar(active)}
                <i.icon size={21} />
                <span className={active ? "font-semibold" : ""}>{i.label}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setOpen(true)} className={cell(menuActive)} aria-haspopup="dialog" aria-expanded={open}>
            {bar(menuActive)}
            <Menu size={21} />
            <span className={menuActive ? "font-semibold" : ""}>Menu</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="no-print fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-ink-900/40 anim-fade-in" aria-label="Tutup menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 shadow-float anim-slide-up" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-200" />
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="text-base font-bold text-ink-900">Menu</div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100" aria-label="Tutup">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {NAV.map((g) => {
                const list = g.items.filter((i) => i.roles.includes(role));
                if (!list.length) return null;
                return (
                  <div key={g.group}>
                    <div className="px-1 pb-1.5 text-xs font-medium text-ink-500">{g.group}</div>
                    <div className="overflow-hidden rounded-2xl border border-ink-200">
                      {list.map((i) => {
                        const active = isActive(pathname, i.href);
                        return (
                          <Link key={i.href} href={i.href} className={cn("flex min-h-12 items-center gap-3 border-b border-ink-100 px-4 text-[15px] last:border-b-0", active ? "bg-brand-50 font-semibold text-brand-800" : "text-ink-800")}>
                            <i.icon size={19} className={active ? "text-brand-700" : "text-ink-400"} />
                            <span className="flex-1">{i.label}</span>
                            <ChevronRight size={16} className="text-ink-300" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="overflow-hidden rounded-2xl border border-ink-200">
                <Link href="/profil" className="flex min-h-12 items-center gap-3 px-4 text-[15px] text-ink-800">
                  <UserCircle size={19} className="text-ink-400" />
                  <span className="flex-1">Profil dan akun</span>
                  <ChevronRight size={16} className="text-ink-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileHeader({ user, unread }: { user: CurrentUser; unread: number }) {
  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-200 bg-white/95 backdrop-blur-md px-4 py-1 md:hidden">
      <Link href="/beranda" className="flex items-center gap-2">
        <PeduliMark size={30} />
        <span className="text-sm font-extrabold tracking-wide text-brand-700">PEDULI</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/notifikasi" className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100" aria-label="Notifikasi">
          <Bell size={20} />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
        </Link>
        <Link href="/profil" aria-label="Profil" className="flex h-11 w-11 items-center justify-center">
          <Avatar name={user.name} image={user.image} size={34} />
        </Link>
      </div>
    </header>
  );
}
