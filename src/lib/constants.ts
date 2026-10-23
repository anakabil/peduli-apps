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
  "BENCANA_ALAM",
] as const;
export type Category = (typeof CATEGORIES)[number];
// Kunci TINDAKAN_TIDAK_AMAN dipertahankan agar data lama tetap sah; labelnya "Perilaku tidak aman"
export const CATEGORY_LABEL: Record<Category, string> = {
  KONDISI_TIDAK_AMAN: "Kondisi tidak aman",
  TINDAKAN_TIDAK_AMAN: "Perilaku tidak aman",
  NYARIS_CELAKA: "Near miss / nyaris celaka",
  ERGONOMI: "Bahaya ergonomi",
  LINGKUNGAN: "Pencemaran lingkungan",
  BENCANA_ALAM: "Bencana alam",
};
export const CATEGORY_SHORT: Record<Category, string> = {
  KONDISI_TIDAK_AMAN: "Kondisi",
  TINDAKAN_TIDAK_AMAN: "Perilaku",
  NYARIS_CELAKA: "Near miss",
  ERGONOMI: "Ergonomi",
  LINGKUNGAN: "Lingkungan",
  BENCANA_ALAM: "Bencana",
};

export const HAZARD_TYPES = ["MANUSIA", "PERALATAN", "MATERIAL_BERBAHAYA", "METODE_KERJA", "LINGKUNGAN_KERJA", "KONDISI_ALAM"] as const;
export type HazardType = (typeof HAZARD_TYPES)[number];
export const HAZARD_TYPE_LABEL: Record<HazardType, string> = {
  MANUSIA: "Manusia",
  PERALATAN: "Peralatan",
  MATERIAL_BERBAHAYA: "Material berbahaya",
  METODE_KERJA: "Metode kerja",
  LINGKUNGAN_KERJA: "Lingkungan kerja",
  KONDISI_ALAM: "Kondisi alam",
};

/** Alasan penolakan laporan, dipakai pada verifikasi maupun keputusan agar penolakan dapat ditelusuri */
export const REJECT_REASONS = ["TIDAK_PERLU_TINDAKAN", "GANDA", "TIDAK_BENAR"] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];
export const REJECT_REASON_LABEL: Record<RejectReason, string> = {
  TIDAK_PERLU_TINDAKAN: "Tidak memerlukan tindakan",
  GANDA: "Laporan ganda",
  TIDAK_BENAR: "Laporan tidak sesuai fakta",
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
