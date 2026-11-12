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
  PERALATAN: "Peralatan / mesin",
  MATERIAL_BERBAHAYA: "Material",
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

/** Jenis notifikasi; menentukan notifikasi ponsel mana yang dikirim (Pengaturan alur) dan yang dimatikan pengguna (Profil) */
export const NOTIF_TYPES = ["TUGAS_VERIFIKASI", "TUGAS_KEPUTUSAN", "ESKALASI", "PENUGASAN", "TINDAK_LANJUT", "STATUS_LAPORAN", "PENGINGAT", "KONSULTASI", "POIN", "ADMINISTRASI"] as const;
export type NotifType = (typeof NOTIF_TYPES)[number];
export const NOTIF_TYPE_LABEL: Record<NotifType, string> = {
  TUGAS_VERIFIKASI: "Laporan perlu verifikasi",
  TUGAS_KEPUTUSAN: "Laporan perlu keputusan",
  ESKALASI: "Eskalasi risiko tinggi",
  PENUGASAN: "Penugasan tindak lanjut",
  TINDAK_LANJUT: "Perkembangan tindak lanjut",
  STATUS_LAPORAN: "Status laporan saya",
  PENGINGAT: "Pengingat batas waktu",
  KONSULTASI: "Konsultasi K3",
  POIN: "Poin dan penukaran",
  ADMINISTRASI: "Administrasi",
};
export const NOTIF_TYPE_DESC: Record<NotifType, string> = {
  TUGAS_VERIFIKASI: "Laporan baru atau revisi yang menunggu verifikasi.",
  TUGAS_KEPUTUSAN: "Laporan yang menunggu keputusan Manager.",
  ESKALASI: "Laporan risiko Tinggi atau Ekstrem di area Anda.",
  PENUGASAN: "Anda ditunjuk sebagai penanggung jawab perbaikan.",
  TINDAK_LANJUT: "Perbaikan dilaporkan selesai atau perlu disempurnakan.",
  STATUS_LAPORAN: "Laporan Anda diverifikasi, disetujui, ditolak, atau ditutup.",
  PENGINGAT: "Tahap yang melewati batas waktu.",
  KONSULTASI: "Pertanyaan baru, diteruskan, dan dijawab.",
  POIN: "Penyesuaian poin dan status penukaran hadiah.",
  ADMINISTRASI: "Pengajuan penukaran dan aktivasi akun.",
};

/** Jenis notifikasi yang relevan bagi tiap peran (pilihan yang tampil di Profil) */
export const NOTIF_TYPE_ROLES: Record<NotifType, Role[]> = {
  TUGAS_VERIFIKASI: ["SUPERINTENDENT", "MANAGER", "ADMIN"],
  TUGAS_KEPUTUSAN: ["MANAGER", "ADMIN"],
  ESKALASI: ["MANAGER", "ADMIN"],
  PENUGASAN: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "ADMIN"],
  TINDAK_LANJUT: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "ADMIN"],
  STATUS_LAPORAN: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI", "ADMIN"],
  PENGINGAT: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "ADMIN"],
  KONSULTASI: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI", "ADMIN"],
  POIN: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"],
  ADMINISTRASI: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI", "ADMIN"],
};

/** Layanan konsultasi K3: pertanyaan pekerja disaring tim HSE lalu dijawab pengurus */
export const CONSULT_TOPICS = ["KEBIJAKAN", "PERALATAN", "PROSEDUR", "LINGKUNGAN", "KESEHATAN", "PELATIHAN", "LAINNYA"] as const;
export type ConsultTopic = (typeof CONSULT_TOPICS)[number];
export const CONSULT_TOPIC_LABEL: Record<ConsultTopic, string> = {
  KEBIJAKAN: "Kebijakan dan program K3",
  PERALATAN: "Peralatan dan APD",
  PROSEDUR: "Prosedur dan izin kerja",
  LINGKUNGAN: "Lingkungan kerja",
  KESEHATAN: "Kesehatan kerja",
  PELATIHAN: "Pelatihan dan kompetensi",
  LAINNYA: "Lainnya",
};
export const CONSULT_STATUS_LABEL: Record<string, string> = { DIAJUKAN: "Disaring tim HSE", DITERUSKAN: "Menunggu jawaban pengurus", DIJAWAB: "Dijawab", DITOLAK: "Tidak diteruskan" };
export const CONSULT_STATUS_TONE: Record<string, "info" | "warn" | "success" | "neutral"> = { DIAJUKAN: "info", DITERUSKAN: "warn", DIJAWAB: "success", DITOLAK: "neutral" };
export const CONSULT_REJECT_REASONS = ["DI_LUAR_K3", "SUDAH_DIJAWAB", "LAPORAN_BAHAYA", "TIDAK_SESUAI_ETIKA"] as const;
export type ConsultRejectReason = (typeof CONSULT_REJECT_REASONS)[number];
export const CONSULT_REJECT_LABEL: Record<ConsultRejectReason, string> = {
  DI_LUAR_K3: "Di luar lingkup K3",
  SUDAH_DIJAWAB: "Sudah dijawab di Tanya jawab",
  LAPORAN_BAHAYA: "Sebaiknya dilaporkan sebagai laporan bahaya",
  TIDAK_SESUAI_ETIKA: "Tidak sesuai etika komunikasi",
};
/** Peran yang dapat ditunjuk sebagai pengurus penjawab */
export const CONSULT_ANSWER_ROLES: Role[] = ["DIREKSI", "MANAGER"];

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
  push: Record<NotifType, boolean>; // jenis notifikasi yang dikirim ke ponsel
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
  push: { TUGAS_VERIFIKASI: true, TUGAS_KEPUTUSAN: true, ESKALASI: true, PENUGASAN: true, TINDAK_LANJUT: true, STATUS_LAPORAN: true, PENGINGAT: true, KONSULTASI: true, POIN: true, ADMINISTRASI: true },
};

export const APP_NAME = "PEDULI Apps";
export const APP_TAGLINE = "Pelaporan Bahaya dan Upaya Pengendalian";
export const COMPANY_NAME = "PT. Garuda Yamato Steel";
export const COMPANY_SHORT = "GYS";
export const DEVELOPER_CREDIT = "Developed by Nusa Safety";
export const APP_VERSION = "1.0.0";
/** Profil pengembang yang tampil pada halaman Tentang */
export const DEVELOPER = {
  brand: "Nusa Safety",
  company: "PT Nusa Rendra Jayatama",
  field: "Konsultan dan pengembang solusi digital di bidang QHSE (quality, health, safety, environment) dan produktivitas",
};
