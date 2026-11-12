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
/** Profil pengembang pada halaman Tentang, bersumber dari nusasafety.co.id */
export const DEVELOPER = {
  brand: "Nusa Safety",
  company: "PT. Nusa Rendra Jayatama",
  tagline: "Mitra tepercaya Anda dalam Keselamatan, Mutu, Kesehatan, Lingkungan, dan Produktivitas.",
  profile:
    "PT. Nusa Rendra Jayatama, yang beroperasi dengan brand Nusa Safety, adalah firma konsultansi di bidang HSSE, mutu, dan produktivitas. Pekerjaannya memadukan penguasaan regulasi Indonesia, ketelitian keteknikan, dan cara kerja digital, dengan klien BUMN dan perusahaan PMA.",
  founder: { name: "M. Reza Huzain, SKM, MKKK", title: "Founder & Principal Consultant" },
  vision: "Menjadi mitra satu pintu yang dipercaya industri untuk menjaga setiap proses bisnis tetap selamat, sehat, bermutu, serta berkelanjutan bagi lingkungan.",
  mission: [
    "Memberikan layanan HSSE, mutu, dan produktivitas yang berdasar pada regulasi dan kaidah ilmiah.",
    "Membangun kompetensi tenaga kerja melalui pelatihan, dengan sertifikasi nasional yang diselenggarakan bersama mitra berizin.",
    "Memindahkan manajemen keselamatan ke sistem digital agar kinerja dapat diukur secara waktu nyata.",
    "Membangun jaringan ahli dan mitra andal yang mengutamakan hasil bagi klien.",
  ],
  services: ["Konsultansi", "Pelatihan & Sertifikasi", "Asesmen & Audit", "Lingkungan & Perizinan", "Aplikasi HSSE"],
  offices: [
    { label: "Kantor Pusat", address: "Jl. Imam Bonjol 36 RT 03/01 Kudaile, Slawi, Tegal, Jawa Tengah" },
    { label: "Kantor Perwakilan", address: "Vila Galaxi Blok BR1 No. 26, Jakasetia, Bekasi, Jawa Barat" },
  ],
  website: "https://nusasafety.co.id",
  email: "admin@nusasafety.co.id",
  whatsapp: { label: "+62 812-2728-0075", href: "https://wa.me/6281227280075" },
  instagram: "https://instagram.com/nusasafety",
  linkedin: "https://www.linkedin.com/company/nusasafety",
  /** Versi bahasa Inggris, bersumber dari nusasafety.co.id/about */
  en: {
    tagline: "Your trusted partner in Safety, Quality, Health, Environment, and Productivity.",
    profile:
      "PT. Nusa Rendra Jayatama, operating as Nusa Safety, is a consulting firm focused on HSSE, quality, and productivity. Its work combines a command of Indonesian regulation, engineering rigour, and digital ways of working, serving state-owned enterprises and foreign-owned (PMA) companies.",
    vision: "To be the one-stop partner that industry trusts to keep every business process safe, healthy, high-quality, and environmentally sustainable.",
    mission: [
      "Deliver HSSE, quality, and productivity services that rest on regulation and science.",
      "Build workforce competence through training, with national certification delivered alongside licensed partners.",
      "Move safety management onto digital systems so performance can be measured in real time.",
      "Build a reliable network of experts and partners that puts client results first.",
    ],
    services: ["Consulting", "Training & Certification", "Assessment & Audit", "Environment & Permits", "HSSE Apps"],
    offices: ["Head Office", "Representative Office"],
  },
};

// ---------------------------------------------------------------- Label dwibahasa
import type { Lang } from "./i18n";

const LABELS_ID = {
  ROLE_LABEL,
  ROLE_DESC,
  USER_STATUS_LABEL,
  CATEGORY_LABEL,
  CATEGORY_SHORT,
  HAZARD_TYPE_LABEL,
  REJECT_REASON_LABEL,
  RISK_LABEL,
  STATUS_LABEL,
  CONTROL_LABEL,
  LEDGER_LABEL,
  REDEMPTION_LABEL,
  EVENT_LABEL,
  NOTIF_TYPE_LABEL,
  NOTIF_TYPE_DESC,
  CONSULT_TOPIC_LABEL,
  CONSULT_STATUS_LABEL,
  CONSULT_REJECT_LABEL,
};

const LABELS_EN: typeof LABELS_ID = {
  ROLE_LABEL: { ADMIN: "Admin", DIREKSI: "Director", MANAGER: "Manager", SUPERINTENDENT: "Superintendent", PENGAWAS: "Supervisor" },
  ROLE_DESC: {
    ADMIN: "Manages accounts, the reward catalogue, point redemptions, and program settings.",
    DIREKSI: "Receives program statistics and performance as a basis for policy.",
    MANAGER: "Approves reports, assigns persons in charge and resources, and sets the workflow.",
    SUPERINTENDENT: "Verifies Supervisor reports: valid, revise, or reject.",
    PENGAWAS: "Reports hazards, tracks their status, and redeems points.",
  },
  USER_STATUS_LABEL: { PENDING: "Awaiting approval", ACTIVE: "Active", INACTIVE: "Inactive" },
  CATEGORY_LABEL: {
    KONDISI_TIDAK_AMAN: "Unsafe condition",
    TINDAKAN_TIDAK_AMAN: "Unsafe act",
    NYARIS_CELAKA: "Near miss",
    ERGONOMI: "Ergonomic hazard",
    LINGKUNGAN: "Environmental pollution",
    BENCANA_ALAM: "Natural disaster",
  },
  CATEGORY_SHORT: { KONDISI_TIDAK_AMAN: "Condition", TINDAKAN_TIDAK_AMAN: "Act", NYARIS_CELAKA: "Near miss", ERGONOMI: "Ergonomics", LINGKUNGAN: "Environment", BENCANA_ALAM: "Disaster" },
  HAZARD_TYPE_LABEL: { MANUSIA: "People", PERALATAN: "Equipment / machinery", MATERIAL_BERBAHAYA: "Material", METODE_KERJA: "Work method", LINGKUNGAN_KERJA: "Work environment", KONDISI_ALAM: "Natural conditions" },
  REJECT_REASON_LABEL: { TIDAK_PERLU_TINDAKAN: "No action required", GANDA: "Duplicate report", TIDAK_BENAR: "Report does not match the facts" },
  RISK_LABEL: { RENDAH: "Low", SEDANG: "Medium", TINGGI: "High", EKSTREM: "Extreme" },
  STATUS_LABEL: {
    MENUNGGU_VERIFIKASI: "Awaiting verification",
    PERLU_REVISI: "Revision required",
    MENUNGGU_KEPUTUSAN: "Awaiting decision",
    DALAM_PERBAIKAN: "Corrective action in progress",
    MENUNGGU_PENUTUPAN: "Awaiting closure",
    SELESAI: "Closed",
    DITOLAK: "Rejected",
  },
  CONTROL_LABEL: { ELIMINASI: "Elimination", SUBSTITUSI: "Substitution", REKAYASA_TEKNIK: "Engineering controls", ADMINISTRATIF: "Administrative controls", APD: "PPE" },
  LEDGER_LABEL: {
    LAPORAN_VALID: "Valid hazard report",
    NYARIS_CELAKA: "Valid near-miss report",
    BONUS_RISIKO: "High/Extreme risk bonus",
    BONUS_USULAN: "Implemented suggestion bonus",
    BONUS_KONSISTEN: "Four-week consistency bonus",
    PENUKARAN: "Reward redemption",
    PENYESUAIAN: "Admin adjustment",
    PEMBATALAN: "Points reversal",
  },
  REDEMPTION_LABEL: { DIAJUKAN: "Submitted", DIPROSES: "Processing", SELESAI: "Completed", DITOLAK: "Rejected" },
  EVENT_LABEL: {
    DIBUAT: "Report created",
    DIVERIFIKASI: "Verified as valid",
    DIREVISI: "Revision requested",
    REVISI_DIKIRIM: "Revision submitted",
    DITOLAK: "Rejected",
    DIPUTUSKAN: "Manager decision",
    PROGRES: "Progress update",
    SELESAI_PERBAIKAN: "Corrective action reported complete",
    DITUTUP: "Report closed",
    DIESKALASI: "Escalated to Manager",
    PENGINGAT: "Deadline reminder",
    AUDIT: "Random audit",
  },
  NOTIF_TYPE_LABEL: {
    TUGAS_VERIFIKASI: "Reports to verify",
    TUGAS_KEPUTUSAN: "Reports awaiting decision",
    ESKALASI: "High-risk escalation",
    PENUGASAN: "Follow-up assignment",
    TINDAK_LANJUT: "Follow-up progress",
    STATUS_LAPORAN: "My report status",
    PENGINGAT: "Deadline reminders",
    KONSULTASI: "OHS consultation",
    POIN: "Points and redemptions",
    ADMINISTRASI: "Administration",
  },
  NOTIF_TYPE_DESC: {
    TUGAS_VERIFIKASI: "New or revised reports awaiting verification.",
    TUGAS_KEPUTUSAN: "Reports awaiting a Manager decision.",
    ESKALASI: "High or Extreme risk reports in your area.",
    PENUGASAN: "You are assigned as the person in charge of a corrective action.",
    TINDAK_LANJUT: "Corrective action reported complete or needing improvement.",
    STATUS_LAPORAN: "Your report is verified, approved, rejected, or closed.",
    PENGINGAT: "Stages past their deadline.",
    KONSULTASI: "New, forwarded, and answered questions.",
    POIN: "Point adjustments and reward redemption status.",
    ADMINISTRASI: "Redemption requests and account activation.",
  },
  CONSULT_TOPIC_LABEL: {
    KEBIJAKAN: "OHS policy and programs",
    PERALATAN: "Equipment and PPE",
    PROSEDUR: "Procedures and work permits",
    LINGKUNGAN: "Work environment",
    KESEHATAN: "Occupational health",
    PELATIHAN: "Training and competence",
    LAINNYA: "Other",
  },
  CONSULT_STATUS_LABEL: { DIAJUKAN: "Screening by HSE team", DITERUSKAN: "Awaiting management answer", DIJAWAB: "Answered", DITOLAK: "Not forwarded" },
  CONSULT_REJECT_LABEL: {
    DI_LUAR_K3: "Outside OHS scope",
    SUDAH_DIJAWAB: "Already answered in Q&A",
    LAPORAN_BAHAYA: "Better submitted as a hazard report",
    TIDAK_SESUAI_ETIKA: "Does not follow communication etiquette",
  },
};

/** Seluruh label domain menurut bahasa: const L = labels(lang); L.STATUS_LABEL[s] */
export function labels(lang: Lang) {
  return lang === "en" ? LABELS_EN : LABELS_ID;
}
export type Labels = typeof LABELS_ID;
