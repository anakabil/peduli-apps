/**
 * Akun dan area contoh untuk mode demo. Dipakai oleh seed dan oleh login demo,
 * sehingga tombol "Mode demo" langsung berfungsi di database yang masih kosong.
 * Tidak mengimpor klien basis data aplikasi agar bisa dipakai dari skrip seed.
 */
import type { PrismaClient } from "@prisma/client";

export const DEMO_DOMAIN = "@demo.peduli.local";

/** Area contoh (koordinat kawasan industri Cilegon, Banten; sesuaikan di menu Area kerja) */
export const SAMPLE_AREAS = [
  { code: "PRD", name: "Produksi", lat: -5.9955, lng: 106.0152, radiusM: 400 },
  { code: "GDG", name: "Gudang", lat: -5.9968, lng: 106.0178, radiusM: 300 },
  { code: "UTL", name: "Utilitas", lat: -5.9942, lng: 106.0131, radiusM: 250 },
  { code: "LOG", name: "Logistik", lat: -5.998, lng: 106.016, radiusM: 350 },
  { code: "KTR", name: "Perkantoran", lat: -5.993, lng: 106.0165, radiusM: 200 },
] as const;

type Spec = { key: string; name: string; role: string; jabatan: string; departemen: string; area?: string; atasan?: string; nik?: string };

/** Urutan penting: atasan dibuat sebelum bawahan */
const SPECS: Spec[] = [
  { key: "admin", name: "Admin Program", role: "ADMIN", jabatan: "Pengelola Program PEDULI", departemen: "HSE" },
  { key: "direksi", name: "Hendra Wijaya", role: "DIREKSI", jabatan: "Direktur Operasional", departemen: "Direksi" },
  { key: "manager", name: "Budi Santoso", role: "MANAGER", jabatan: "Manager Produksi", departemen: "Produksi", area: "PRD" },
  { key: "manager2", name: "Sri Lestari", role: "MANAGER", jabatan: "Manager Gudang dan Logistik", departemen: "Supply Chain", area: "GDG" },
  { key: "superintendent", name: "Agus Prasetyo", role: "SUPERINTENDENT", jabatan: "Superintendent Produksi", departemen: "Produksi", area: "PRD", atasan: "manager" },
  { key: "superintendent2", name: "Dewi Anggraini", role: "SUPERINTENDENT", jabatan: "Superintendent Gudang", departemen: "Supply Chain", area: "GDG", atasan: "manager2" },
  { key: "pengawas", name: "Rizky Firmansyah", role: "PENGAWAS", jabatan: "Pengawas Shift A", departemen: "Produksi", area: "PRD", atasan: "superintendent", nik: "GYS-0101" },
  { key: "pengawas2", name: "Yuni Astuti", role: "PENGAWAS", jabatan: "Pengawas Gudang", departemen: "Supply Chain", area: "GDG", atasan: "superintendent2", nik: "GYS-0102" },
  { key: "pengawas3", name: "Dani Kurniawan", role: "PENGAWAS", jabatan: "Pengawas Utilitas", departemen: "Utilitas", area: "UTL", atasan: "superintendent", nik: "GYS-0103" },
];

/** Manager pengelola tiap area contoh */
const AREA_MANAGER: Record<string, string> = { PRD: "manager", UTL: "manager", KTR: "manager", GDG: "manager2", LOG: "manager2" };

export const SAMPLE_REWARDS = [
  { name: "Payung", description: "Contoh hadiah tingkat awal", pointsCost: 10, stock: 50, tier: "AWAL", icon: "Umbrella" },
  { name: "Tumbler", description: "Contoh hadiah tingkat lanjut", pointsCost: 200, stock: 20, tier: "LANJUT", icon: "CupSoda" },
  { name: "Sepatu keselamatan", description: "Contoh hadiah tingkat menengah", pointsCost: 100, stock: 15, tier: "MENENGAH", icon: "Footprints" },
  { name: "Voucher belanja", description: "Senilai Rp100.000", pointsCost: 60, stock: 30, tier: "MENENGAH", icon: "Ticket" },
];

/** Katalog reward contoh, hanya diisi bila katalog masih kosong */
export async function ensureSampleRewards(client: PrismaClient) {
  if ((await client.reward.count()) === 0) await client.reward.createMany({ data: SAMPLE_REWARDS });
}

export type DemoUser = { id: string; role: string; atasanId: string | null };

/**
 * Memastikan area contoh dan akun demo ada.
 * overwrite=false (login demo): hanya membuat yang belum ada, tidak mengubah data yang sudah diatur admin.
 * overwrite=true (seed): menyelaraskan peran, atasan, dan manager area dengan data contoh.
 */
export async function ensureDemoAccounts(client: PrismaClient, opts: { overwrite?: boolean } = {}) {
  const overwrite = !!opts.overwrite;
  const areaIds: Record<string, string> = {};
  const existingAreas = await client.area.findMany({ where: { code: { in: SAMPLE_AREAS.map((a) => a.code) } } });
  for (const a of SAMPLE_AREAS) {
    const found = existingAreas.find((x) => x.code === a.code);
    areaIds[a.code] = found ? found.id : (await client.area.upsert({ where: { code: a.code }, create: { ...a }, update: {} })).id;
  }

  const users: Record<string, DemoUser> = {};
  for (const s of SPECS) {
    const email = `${s.key}${DEMO_DOMAIN}`;
    const data = {
      name: s.name,
      role: s.role,
      status: "ACTIVE",
      jabatan: s.jabatan,
      departemen: s.departemen,
      areaId: s.area ? areaIds[s.area] : null,
      atasanId: s.atasan ? users[s.atasan]?.id ?? null : null,
    };
    const existing = await client.user.findUnique({ where: { email }, select: { id: true, role: true, atasanId: true } });
    let u: DemoUser;
    if (!existing) {
      // NIK hanya dipakai bila belum dimiliki pengguna lain
      const nikFree = s.nik ? !(await client.user.findFirst({ where: { nik: s.nik }, select: { id: true } })) : false;
      u = await client.user.create({ data: { email, emailVerified: new Date(), ...data, nik: nikFree ? s.nik : null }, select: { id: true, role: true, atasanId: true } });
    } else if (overwrite) {
      u = await client.user.update({ where: { email }, data, select: { id: true, role: true, atasanId: true } });
    } else {
      u = existing;
    }
    users[s.key] = u;
  }

  for (const [code, key] of Object.entries(AREA_MANAGER)) {
    const managerId = users[key].id;
    if (overwrite) await client.area.update({ where: { id: areaIds[code] }, data: { managerId } });
    else await client.area.updateMany({ where: { id: areaIds[code], managerId: null }, data: { managerId } });
  }
  return { users, areaIds };
}
