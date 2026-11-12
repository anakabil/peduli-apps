"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PlusCircle, Bell, UserCircle, Menu, X, ChevronRight } from "lucide-react";
import type { Role } from "@/lib/constants";
import { cn } from "@/lib/format";
import { menuIcon } from "@/lib/icons";
import { PeduliMark, AboutButton } from "@/components/brand";
import type { CurrentUser } from "@/lib/session";
import { Avatar } from "@/components/ui";
import { useLang, useTr } from "@/components/i18n/lang-provider";
import { LangSwitch } from "@/components/i18n/lang-switch";

type Item = { href: string; label: string; en: string; icon: string; roles: Role[] };

/** Ikon menu dua warna; yang tidak aktif sedikit diredam agar menu aktif tetap menonjol */
function NavIcon({ name, size, active }: { name: string; size: number; active: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={menuIcon(name)} alt="" aria-hidden width={size} height={size} className={cn("shrink-0 transition-[filter,opacity]", !active && "opacity-80 saturate-[.8]")} />;
}

const ALL: Role[] = ["ADMIN", "DIREKSI", "MANAGER", "SUPERINTENDENT", "PENGAWAS"];

export const NAV: Array<{ group: string; groupEn: string; items: Item[] }> = [
  {
    group: "Utama",
    groupEn: "Main",
    items: [
      { href: "/beranda", label: "Beranda", en: "Home", icon: "beranda", roles: ALL },
      { href: "/lapor", label: "Lapor bahaya", en: "Report a hazard", icon: "lapor", roles: ALL },
      { href: "/laporan", label: "Laporan", en: "Reports", icon: "laporan", roles: ALL },
    ],
  },
  {
    group: "Tugas",
    groupEn: "Tasks",
    items: [
      { href: "/verifikasi", label: "Verifikasi", en: "Verification", icon: "verifikasi", roles: ["SUPERINTENDENT", "ADMIN"] },
      { href: "/keputusan", label: "Keputusan", en: "Decisions", icon: "keputusan", roles: ["MANAGER", "ADMIN"] },
      { href: "/tindak-lanjut", label: "Tindak lanjut", en: "Follow-up", icon: "tindak-lanjut", roles: ["MANAGER", "SUPERINTENDENT", "PENGAWAS", "ADMIN"] },
    ],
  },
  {
    group: "Program",
    groupEn: "Program",
    items: [
      { href: "/poin", label: "Poin dan reward", en: "Points and rewards", icon: "poin", roles: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"] },
      { href: "/statistik", label: "Statistik", en: "Statistics", icon: "statistik", roles: ["DIREKSI", "MANAGER", "ADMIN"] },
      { href: "/konsultasi", label: "Konsultasi K3", en: "OHS consultation", icon: "konsultasi", roles: ALL },
      { href: "/panduan", label: "Panduan", en: "Guide", icon: "panduan", roles: ALL },
    ],
  },
  {
    group: "Administrasi",
    groupEn: "Administration",
    items: [
      { href: "/admin/pengguna", label: "Pengguna", en: "Users", icon: "pengguna", roles: ["ADMIN"] },
      { href: "/admin/area", label: "Area kerja", en: "Work areas", icon: "area", roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/akuntabilitas", label: "Akuntabilitas", en: "Accountability", icon: "akuntabilitas", roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/reward", label: "Katalog reward", en: "Reward catalogue", icon: "katalog", roles: ["ADMIN"] },
      { href: "/admin/penukaran", label: "Penukaran poin", en: "Point redemptions", icon: "penukaran", roles: ["ADMIN"] },
      { href: "/admin/pengaturan", label: "Pengaturan alur", en: "Workflow settings", icon: "pengaturan", roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/audit", label: "Jejak audit", en: "Audit trail", icon: "audit", roles: ["ADMIN"] },
    ],
  },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const lang = useLang();
  const tr = useTr();
  return (
    <div className="space-y-5">
      {NAV.map((g) => {
        const items = g.items.filter((i) => i.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={g.group}>
            <div className="px-3 pb-1.5 text-xs font-medium text-ink-500">{lang === "en" ? g.groupEn : g.group}</div>
            <div className="space-y-0.5">
              {items.map((i) => {
                const active = pathname === i.href || pathname.startsWith(i.href + "/");
                return (
                  <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("nav-item", active && "nav-item-active")}>
                    <NavIcon name={i.icon} size={20} active={active} />
                    {lang === "en" ? i.en : i.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="border-t border-ink-100 pt-3">
        <Link href="/tentang" aria-current={pathname === "/tentang" ? "page" : undefined} className={cn("nav-item", pathname === "/tentang" && "nav-item-active")}>
          <NavIcon name="tentang" size={20} active={pathname === "/tentang"} />
          {tr("Tentang PEDULI", "About PEDULI")}
        </Link>
      </div>
    </div>
  );
}

type MobileItem = { href: string; label: string; en: string; icon: Item["icon"] };

// Empat pintasan per peran; menu lengkap (termasuk administrasi) dibuka lewat tombol Menu
const MOBILE: Record<Role, MobileItem[]> = {
  PENGAWAS: [
    { href: "/beranda", label: "Beranda", en: "Home", icon: "beranda" },
    { href: "/laporan", label: "Laporan", en: "Reports", icon: "laporan" },
    { href: "/lapor", label: "Lapor", en: "Report", icon: "lapor" },
    { href: "/poin", label: "Poin", en: "Points", icon: "poin" },
  ],
  SUPERINTENDENT: [
    { href: "/beranda", label: "Beranda", en: "Home", icon: "beranda" },
    { href: "/verifikasi", label: "Verifikasi", en: "Verification", icon: "verifikasi" },
    { href: "/lapor", label: "Lapor", en: "Report", icon: "lapor" },
    { href: "/tindak-lanjut", label: "Tindak lanjut", en: "Follow-up", icon: "tindak-lanjut" },
  ],
  MANAGER: [
    { href: "/beranda", label: "Beranda", en: "Home", icon: "beranda" },
    { href: "/keputusan", label: "Keputusan", en: "Decisions", icon: "keputusan" },
    { href: "/lapor", label: "Lapor", en: "Report", icon: "lapor" },
    { href: "/tindak-lanjut", label: "Tindak lanjut", en: "Follow-up", icon: "tindak-lanjut" },
  ],
  DIREKSI: [
    { href: "/beranda", label: "Beranda", en: "Home", icon: "beranda" },
    { href: "/statistik", label: "Statistik", en: "Statistics", icon: "statistik" },
    { href: "/lapor", label: "Lapor", en: "Report", icon: "lapor" },
    { href: "/laporan", label: "Laporan", en: "Reports", icon: "laporan" },
  ],
  ADMIN: [
    { href: "/beranda", label: "Beranda", en: "Home", icon: "beranda" },
    { href: "/laporan", label: "Laporan", en: "Reports", icon: "laporan" },
    { href: "/lapor", label: "Lapor", en: "Report", icon: "lapor" },
    { href: "/statistik", label: "Statistik", en: "Statistics", icon: "statistik" },
  ],
};

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const lang = useLang();
  const tr = useTr();
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
                    <PlusCircle size={22} />
                  </span>
                  <span className={active ? "font-semibold" : ""}>{lang === "en" ? i.en : i.label}</span>
                </Link>
              );
            }
            return (
              <Link key={i.href} href={i.href} className={cell(active)} aria-current={active ? "page" : undefined}>
                {bar(active)}
                <NavIcon name={i.icon} size={22} active={active} />
                <span className={active ? "font-semibold" : ""}>{lang === "en" ? i.en : i.label}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setOpen(true)} className={cell(menuActive)} aria-haspopup="dialog" aria-expanded={open}>
            {bar(menuActive)}
            <Menu size={21} />
            <span className={menuActive ? "font-semibold" : ""}>{tr("Menu", "Menu")}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="no-print fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-ink-900/40 anim-fade-in" aria-label={tr("Tutup menu", "Close menu")} onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 shadow-float anim-slide-up" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-200" />
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="text-base font-bold text-ink-900">Menu</div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100" aria-label={tr("Tutup", "Close")}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {NAV.map((g) => {
                const list = g.items.filter((i) => i.roles.includes(role));
                if (!list.length) return null;
                return (
                  <div key={g.group}>
                    <div className="px-1 pb-1.5 text-xs font-medium text-ink-500">{lang === "en" ? g.groupEn : g.group}</div>
                    <div className="overflow-hidden rounded-2xl border border-ink-200">
                      {list.map((i) => {
                        const active = isActive(pathname, i.href);
                        return (
                          <Link key={i.href} href={i.href} className={cn("flex min-h-12 items-center gap-3 border-b border-ink-100 px-4 text-[15px] last:border-b-0", active ? "bg-brand-50 font-semibold text-brand-800" : "text-ink-800")}>
                            <NavIcon name={i.icon} size={21} active={active} />
                            <span className="flex-1">{lang === "en" ? i.en : i.label}</span>
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
                  <span className="flex-1">{tr("Profil dan akun", "Profile and account")}</span>
                  <ChevronRight size={16} className="text-ink-300" />
                </Link>
                <Link href="/tentang" className="flex min-h-12 items-center gap-3 border-t border-ink-100 px-4 text-[15px] text-ink-800">
                  <NavIcon name="tentang" size={21} active={false} />
                  <span className="flex-1">{tr("Tentang PEDULI", "About PEDULI")}</span>
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
  const tr = useTr();
  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-200 bg-white/95 backdrop-blur-md px-4 py-1 md:hidden">
      <Link href="/beranda" className="flex items-center gap-2">
        <PeduliMark size={30} />
        <span className="text-sm font-extrabold tracking-wide text-brand-700">PEDULI</span>
      </Link>
      <AboutButton className="mr-auto" />
      <div className="flex items-center gap-1">
        <LangSwitch />
        <Link href="/notifikasi" className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100" aria-label={tr("Notifikasi", "Notifications")}>
          <Bell size={20} />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
        </Link>
        <Link href="/profil" aria-label={tr("Profil", "Profile")} className="flex h-11 w-11 items-center justify-center">
          <Avatar name={user.name} image={user.image} size={34} />
        </Link>
      </div>
    </header>
  );
}
