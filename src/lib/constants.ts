// Konstanta domain PEDULI Apps

export const ROLES = ["ADMIN", "DIREKSI", "MANAGER", "SUPERINTENDENT", "PENGAWAS"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  DIREKSI: "Direksi",
  MANAGER: "Manager",
  SUPERINTENDENT: "Superintendent",
  PENGAWAS: "Pengawas",
};

export const ROLE_DESC: Record<Role, string> = {
  ADMIN: "Mengelola akun, katalog reward, penukaran poin, dan pengaturan program.",
  DIREKSI: "Menerima statistik dan performa program sebagai dasar kebijakan.",
  MANAGER: "Menyetujui laporan, menetapkan penanggung jawab dan sumber daya, mengatur alur.",
  SUPERINTENDENT: "Memverifikasi laporan Pengawas: valid, revisi, atau tolak.",
  PENGAWAS: "Membuat laporan bahaya, memantau status, dan menukar poin.",
};

export const USER_STATUS = ["PENDING", "ACTIVE", "INACTIVE"] as const;
export const USER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu persetujuan",
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
};

export const CATEGORIES = [
  "KONDISI_TIDAK_AMAN",
  "TINDAKAN_TIDAK_AMAN",
  "NYARIS_CELAKA",
  "ERGONOMI",
  "LINGKUNGAN",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABEL: Record<Category, string> = {
  KONDISI_TIDAK_AMAN: "Kondisi tidak aman",
  TINDAKAN_TIDAK_AMAN: "Tindakan tidak aman",
  NYARIS_CELAKA: "Nyaris celaka",
  ERGONOMI: "Ergonomi",
  LINGKUNGAN: "Lingkungan",
};
export const CATEGORY_SHORT: Record<Category, string> = {
  KONDISI_TIDAK_AMAN: "Kondisi",
  TINDAKAN_TIDAK_AMAN: "Tindakan",
  NYARIS_CELAKA: "Nyaris celaka",
  ERGONOMI: "Ergonomi",
  LINGKUNGAN: "Lingkungan",
};

export const RISKS = ["RENDAH", "SEDANG", "TINGGI", "EKSTREM"] as const;
export type Risk = (typeof RISKS)[number];
export const RISK_LABEL: Record<Risk, string> = {
  RENDAH: "Rendah",
  SEDANG: "Sedang",
  TINGGI: "Tinggi",
  EKSTREM: "Ekstrem",
};
export const RISK_COLOR: Record<Risk, string> = {
  RENDAH: "#2E9E6B",
  SEDANG: "#D9A520",
  TINGGI: "#E07A1F",
  EKSTREM: "#C8373B",
};

export const STATUSES = [
  "MENUNGGU_VERIFIKASI",
  "PERLU_REVISI",
  "MENUNGGU_KEPUTUSAN",
  "DALAM_PERBAIKAN",
  "MENUNGGU_PENUTUPAN",
  "SELESAI",
  "DITOLAK",
] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<Status, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi",
  PERLU_REVISI: "Perlu revisi",
  MENUNGGU_KEPUTUSAN: "Menunggu keputusan",
  DALAM_PERBAIKAN: "Dalam perbaikan",
  MENUNGGU_PENUTUPAN: "Menunggu penutupan",
  SELESAI: "Selesai",
  DITOLAK: "Ditolak",
};
export const STATUS_TONE: Record<Status, "neutral" | "info" | "warn" | "success" | "danger" | "brand"> = {
  MENUNGGU_VERIFIKASI: "info",
  PERLU_REVISI: "warn",
  MENUNGGU_KEPUTUSAN: "brand",
  DALAM_PERBAIKAN: "warn",
  MENUNGGU_PENUTUPAN: "info",
  SELESAI: "success",
  DITOLAK: "danger",
};
export const OPEN_STATUSES: Status[] = [
  "MENUNGGU_VERIFIKASI",
  "PERLU_REVISI",
  "MENUNGGU_KEPUTUSAN",
  "DALAM_PERBAIKAN",
  "MENUNGGU_PENUTUPAN",
];

export const CONTROLS = ["ELIMINASI", "SUBSTITUSI", "REKAYASA_TEKNIK", "ADMINISTRATIF", "APD"] as const;
export type Control = (typeof CONTROLS)[number];
export const CONTROL_LABEL: Record<Control, string> = {
  ELIMINASI: "Eliminasi",
  SUBSTITUSI: "Substitusi",
  REKAYASA_TEKNIK: "Rekayasa teknik",
  ADMINISTRATIF: "Administratif",
  APD: "APD",
};

export const LEDGER_LABEL: Record<string, string> = {
  LAPORAN_VALID: "Laporan bahaya valid",
  NYARIS_CELAKA: "Laporan nyaris celaka valid",
  BONUS_RISIKO: "Bonus risiko Tinggi/Ekstrem",
  BONUS_USULAN: "Bonus usulan perbaikan diterapkan",
  BONUS_KONSISTEN: "Bonus konsisten empat minggu",
  PENUKARAN: "Penukaran hadiah",
  PENYESUAIAN: "Penyesuaian admin",
  PEMBATALAN: "Pembatalan poin",
};

export const REDEMPTION_LABEL: Record<string, string> = {
  DIAJUKAN: "Diajukan",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITOLAK: "Ditolak",
};

export const EVENT_LABEL: Record<string, string> = {
  DIBUAT: "Laporan dibuat",
  DIVERIFIKASI: "Diverifikasi valid",
  DIREVISI: "Diminta revisi",
  REVISI_DIKIRIM: "Revisi dikirim",
  DITOLAK: "Ditolak",
  DIPUTUSKAN: "Keputusan Manager",
  PROGRES: "Pembaruan progres",
  SELESAI_PERBAIKAN: "Perbaikan dilaporkan selesai",
  DITUTUP: "Laporan ditutup",
  DIESKALASI: "Dieskalasi ke Manager",
  PENGINGAT: "Pengingat batas waktu",
  AUDIT: "Audit acak",
};

export type AppSettings = {
  verificationRequired: boolean; // terkunci: true
  verifyDeadlineDays: number;
  decideDeadlineDays: number;
  escalateHighRisk: boolean;
  reminders: boolean;
  picByArea: boolean;
  managerPeerReview: boolean;
  points: {
    valid: number;
    nearMiss: number;
    highRiskBonus: number;
    suggestionBonus: number;
    streakBonus: number;
  };
  levels: { perak: number; emas: number };
  eligibleRoles: Role[]; // peran yang berhak menerima poin
};

export const DEFAULT_SETTINGS: AppSettings = {
  verificationRequired: true,
  verifyDeadlineDays: 2,
  decideDeadlineDays: 3,
  escalateHighRisk: true,
  reminders: true,
  picByArea: true,
  managerPeerReview: true,
  points: { valid: 2, nearMiss: 3, highRiskBonus: 3, suggestionBonus: 3, streakBonus: 5 },
  levels: { perak: 50, emas: 150 },
  eligibleRoles: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"],
};

export const APP_NAME = "PEDULI Apps";
export const APP_TAGLINE = "Pelaporan Bahaya dan Upaya Pengendalian";
export const COMPANY_NAME = "PT. Garuda Yamato Steel";
export const COMPANY_SHORT = "GYS";
export const DEVELOPER_CREDIT = "Developed by Nusa Safety";

// ---------- Kartu STOP (DuPont Safety Training Observation Program) ----------
// Siklus pengamatan: Memutuskan, Berhenti, Mengamati, Bertindak, Melapor.

export type StopItem = { key: string; label: string; suggests?: Category };
export type StopGroup = { key: string; label: string; hint: string; items: StopItem[] };

export const STOP_GROUPS: StopGroup[] = [
  {
    key: "RS",
    label: "Reaksi seseorang",
    hint: "Apa yang dilakukan orang saat melihat Anda mendekat",
    items: [
      { key: "RS_APD", label: "Memakai atau membetulkan posisi alat pelindung diri", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "RS_POSISI", label: "Merubah posisi", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "RS_ATUR", label: "Mengatur ulang pekerjaan", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "RS_HENTI", label: "Menghentikan pekerjaan", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "RS_GROUND", label: "Memasang kabel massa atau ground", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "RS_LOTO", label: "Memasang lockout", suggests: "TINDAKAN_TIDAK_AMAN" },
    ],
  },
  {
    key: "APD",
    label: "Alat pelindung diri",
    hint: "Bagian tubuh yang tidak terlindungi dengan benar",
    items: [
      { key: "APD_KEPALA", label: "Kepala", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "APD_MATA", label: "Mata dan muka", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "APD_TELINGA", label: "Telinga", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "APD_NAPAS", label: "Sistem pernapasan", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "APD_TANGAN", label: "Jari dan tangan", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "APD_TUBUH", label: "Tubuh", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "APD_KAKI", label: "Kaki dan telapak kaki", suggests: "TINDAKAN_TIDAK_AMAN" },
    ],
  },
  {
    key: "PS",
    label: "Posisi seseorang",
    hint: "Posisi yang dapat menyebabkan cedera",
    items: [
      { key: "PS_MEMBENTUR", label: "Membentur atau menabrak benda", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "PS_TERPUKUL", label: "Terpukul atau terhantam benda", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "PS_TERJEPIT", label: "Tersangkut di dalam, pada, atau di antara benda", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "PS_JATUH", label: "Terjatuh dari ketinggian yang sama atau berbeda", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "PS_SUHU", label: "Kontak dengan suhu yang sangat panas atau dingin", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "PS_LISTRIK", label: "Kontak dengan arus listrik", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "PS_HIRUP", label: "Menghisap atau menghirup bahan berbahaya", suggests: "LINGKUNGAN" },
      { key: "PS_SERAP", label: "Menyerap bahan berbahaya", suggests: "LINGKUNGAN" },
      { key: "PS_TELAN", label: "Menelan bahan berbahaya", suggests: "LINGKUNGAN" },
      { key: "PS_ANGKAT", label: "Mengangkat terlalu berat atau memaksakan diri", suggests: "ERGONOMI" },
      { key: "PS_ULANG", label: "Gerakan berulang-ulang", suggests: "ERGONOMI" },
      { key: "PS_CANGGUNG", label: "Posisi canggung atau sikap tubuh yang salah", suggests: "ERGONOMI" },
    ],
  },
  {
    key: "PP",
    label: "Perkakas dan peralatan",
    hint: "Alat kerja yang dipakai",
    items: [
      { key: "PP_TIDAK_SESUAI", label: "Tidak sesuai dengan jenis pekerjaan", suggests: "KONDISI_TIDAK_AMAN" },
      { key: "PP_TIDAK_TEPAT", label: "Digunakan secara tidak tepat", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "PP_TIDAK_AMAN", label: "Dalam kondisi tidak aman", suggests: "KONDISI_TIDAK_AMAN" },
    ],
  },
  {
    key: "PK",
    label: "Prosedur dan keteraturan",
    hint: "Prosedur kerja dan kerapihan (housekeeping)",
    items: [
      { key: "PK_PROS_KURANG", label: "Prosedur tidak memadai", suggests: "KONDISI_TIDAK_AMAN" },
      { key: "PK_PROS_TAHU", label: "Prosedur tidak diketahui atau dimengerti", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "PK_PROS_PATUH", label: "Prosedur tidak diikuti atau dipatuhi", suggests: "TINDAKAN_TIDAK_AMAN" },
      { key: "PK_RAPI_KURANG", label: "Standar kerapihan tidak memadai", suggests: "KONDISI_TIDAK_AMAN" },
      { key: "PK_RAPI_TAHU", label: "Standar kerapihan tidak diketahui atau dimengerti", suggests: "KONDISI_TIDAK_AMAN" },
      { key: "PK_RAPI_PATUH", label: "Standar kerapihan tidak diikuti atau dipatuhi", suggests: "KONDISI_TIDAK_AMAN" },
    ],
  },
];

export const STOP_ITEMS: Record<string, StopItem & { group: string }> = Object.fromEntries(
  STOP_GROUPS.flatMap((g) => g.items.map((i) => [i.key, { ...i, group: g.key }]))
);
export const STOP_GROUP_LABEL: Record<string, string> = Object.fromEntries(STOP_GROUPS.map((g) => [g.key, g.label]));

export const ACTIVITIES = [
  { key: "HOUSEKEEPING", label: "Housekeeping dan pembuangan limbah" },
  { key: "CATERING", label: "Katering (laundry, memasak)" },
  { key: "KIMIA", label: "Penanganan bahan kimia" },
  { key: "RUANG_TERBATAS", label: "Ruang terbatas (confined space)" },
  { key: "ALAT_BERAT", label: "Operasi alat berat" },
  { key: "LISTRIK", label: "Pekerjaan kelistrikan" },
  { key: "LOTO", label: "Isolasi energi (LOTO)" },
  { key: "RADIOGRAFI", label: "Radiografi" },
  { key: "ANGKAT", label: "Pengangkatan dan rigging (crane)" },
  { key: "KETINGGIAN", label: "Tangga dan perancah (scaffolding)" },
  { key: "MANUAL", label: "Penanganan material manual" },
  { key: "TRANSPORTASI", label: "Transportasi (darat atau air)" },
  { key: "PANAS", label: "Pengelasan, pemotongan, dan pekerjaan panas" },
  { key: "OPERASI", label: "Operasi rutin" },
  { key: "PERAWATAN", label: "Perawatan rutin" },
  { key: "LAINNYA", label: "Lainnya" },
] as const;
export const ACTIVITY_LABEL: Record<string, string> = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.label]));

/** Kategori bahaya yang paling sering disarankan oleh item STOP terpilih */
export function suggestCategory(items: string[]): Category | null {
  const tally = new Map<Category, number>();
  for (const k of items) {
    const c = STOP_ITEMS[k]?.suggests;
    if (c) tally.set(c, (tally.get(c) ?? 0) + 1);
  }
  let best: Category | null = null;
  let n = 0;
  for (const [c, v] of tally) if (v > n) [best, n] = [c, v];
  return best;
}
