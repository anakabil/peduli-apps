import type { Category, HazardType } from "./constants";

/** Pustaka ikon PEDULI di /public/ikon (lihat docs/daftar-ikon-peduli.md) */
export const CATEGORY_IMG: Record<Category, string> = {
  KONDISI_TIDAK_AMAN: "/ikon/kategori/kat-kondisi-tidak-aman.webp",
  TINDAKAN_TIDAK_AMAN: "/ikon/kategori/kat-perilaku-tidak-aman.webp",
  NYARIS_CELAKA: "/ikon/kategori/kat-near-miss.webp",
  ERGONOMI: "/ikon/kategori/kat-ergonomi.webp",
  LINGKUNGAN: "/ikon/kategori/kat-pencemaran-lingkungan.webp",
  BENCANA_ALAM: "/ikon/kategori/kat-bencana-alam.webp",
};

export const HAZARD_IMG: Record<HazardType, string> = {
  MANUSIA: "/ikon/jenis/jenis-manusia.webp",
  PERALATAN: "/ikon/jenis/jenis-peralatan.webp",
  MATERIAL_BERBAHAYA: "/ikon/jenis/jenis-material-berbahaya.webp",
  METODE_KERJA: "/ikon/jenis/jenis-metode-kerja.webp",
  LINGKUNGAN_KERJA: "/ikon/jenis/jenis-lingkungan-kerja.webp",
  KONDISI_ALAM: "/ikon/jenis/jenis-kondisi-alam.webp",
};

const LEVEL_IMG: Record<string, string> = { Perunggu: "/ikon/level/level-perunggu.webp", Perak: "/ikon/level/level-perak.webp", Emas: "/ikon/level/level-emas.webp" };
export const levelImg = (name: string) => LEVEL_IMG[name] ?? LEVEL_IMG.Perunggu;

export const ILLUSTRATION = {
  kosongLaporan: "/ikon/ilustrasi/kosong-laporan.webp",
  kosongNotifikasi: "/ikon/ilustrasi/kosong-notifikasi.webp",
  kosongPenukaran: "/ikon/ilustrasi/kosong-penukaran.webp",
  laporanTerkirim: "/ikon/ilustrasi/laporan-terkirim.webp",
  luring: "/ikon/ilustrasi/luring.webp",
  menungguPersetujuan: "/ikon/ilustrasi/menunggu-persetujuan.webp",
} as const;

/** Ikon menu dua warna (SVG) */
export const menuIcon = (name: string) => `/ikon/menu/menu-${name}.svg`;
