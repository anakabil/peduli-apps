/**
 * Dwibahasa PEDULI (Indonesia dan Inggris).
 *
 * Teks ditulis berpasangan di tempat dipakai: tr("Teks Indonesia", "English text").
 * Bahasa Indonesia tetap bawaan; bahasa Inggris untuk personel asing di perusahaan PMA.
 * Server: const { lang, tr } = await getTr()  (src/lib/i18n-server.ts)
 * Klien:  const tr = useTr(); const lang = useLang()  (src/components/i18n/lang-provider.tsx)
 * Label domain (peran, status, kategori, dan lain-lain): labels(lang) di src/lib/constants.ts
 *
 * Glosarium bahasa Inggris yang dipakai konsisten di seluruh aplikasi:
 *   Laporan bahaya = Hazard report; Lapor bahaya = Report a hazard; Pelapor = Reporter
 *   Verifikasi = Verification; Keputusan = Decision; Tindak lanjut = Follow-up; Perbaikan = Corrective action
 *   Penutupan = Closure; Penanggung jawab = Person in charge (PIC); Batas waktu = Deadline; Target selesai = Target date
 *   Jenis bahaya = Hazard type; Sumber bahaya = Hazard source; Tingkat risiko (awal) = (Initial) risk level
 *   Hierarki pengendalian = Hierarchy of controls; Sumber daya = Resources; Usulan perbaikan = Suggested action
 *   Pengawas = Supervisor; Direksi = Director(s); Pengurus = Management; Tim HSE = HSE team
 *   K3 = OHS; SMK3 = OHS management system (SMK3); APD = PPE; Konsultasi K3 = OHS consultation
 *   Poin dan reward = Points and rewards; Penukaran = Redemption; Katalog hadiah = Reward catalogue
 *   Area kerja = Work area; Akuntabilitas = Accountability; Pengaturan alur = Workflow settings
 *   Jejak audit = Audit trail; Data uji coba = Trial data; Klasemen pelapor = Reporter leaderboard
 *   Beranda = Home; Panduan = Guide; Profil = Profile; Masuk = Sign in; Keluar = Sign out; Notifikasi = Notifications
 */
export const LANGS = ["id", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_COOKIE = "peduli_lang";
export const isLang = (v: unknown): v is Lang => v === "id" || v === "en";

export type Tr = (id: string, en: string) => string;
export const makeTr = (lang: Lang): Tr => (id, en) => (lang === "en" ? en : id);

/** Teks dwibahasa yang disimpan atau dikirim (notifikasi) */
export type Bi = { id: string; en: string };
export const bi = (id: string, en: string): Bi => ({ id, en });
export const pick = (v: string | Bi | null | undefined, lang: Lang) => (v == null ? v : typeof v === "string" ? v : lang === "en" ? v.en : v.id);
