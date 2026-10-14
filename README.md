# PEDULI Apps

Pelaporan Bahaya dan Upaya Pengendalian untuk PT. Garuda Yamato Steel (GYS). Aplikasi web progresif (PWA) yang dapat dipasang di smartphone maupun digunakan di laptop, dengan alur lapor, verifikasi, keputusan, perbaikan, dan penutupan, lengkap dengan sistem poin, katalog reward, dan dashboard statistik yang dapat diekspor ke PDF, PowerPoint, dan CSV.

Developed by Nusa Safety (PT. Nusa Rendra Jayatama).

## Ringkasan fitur

| Modul | Keterangan |
| --- | --- |
| Masuk | Akun Google (OAuth) dan Google One Tap yang otomatis menawarkan akun Google di smartphone. Akun baru berstatus menunggu persetujuan admin. Email pada `ADMIN_EMAILS` otomatis menjadi Admin. |
| PWA | Tawaran pasang ke layar utama saat pertama membuka di smartphone, ikon aplikasi, mode luring (laporan disimpan di perangkat dan dikirim otomatis saat sinyal kembali). |
| Lapor bahaya | Foto langsung dari kamera (dikompresi di perangkat), koordinat GPS dan akurasinya, cap waktu server, kategori, risiko awal, uraian, usulan perbaikan. Area kerja ditentukan otomatis dari koordinat; lokasi di luar radius ditandai untuk ditinjau. Nomor laporan unik `PDL-YYYYMM-NNNN`. |
| Jalur A | Laporan Pengawas diverifikasi Superintendent (valid, revisi, tolak), lalu diputuskan Manager. |
| Jalur B | Laporan Superintendent, Manager, dan Direksi langsung ke Manager. Laporan Manager ditinjau Manager lain. |
| Keputusan Manager | Setujui atau tolak, penanggung jawab, sumber daya (tenaga, biaya, material), target selesai, hierarki pengendalian (ISO 45001:2018 klausul 8.1.2). |
| Perbaikan dan penutupan | Pembaruan progres dengan foto bukti, pengajuan penutupan, verifikasi hasil, ketepatan waktu tercatat. |
| Poin dan reward | Poin diberikan setelah laporan terverifikasi (valid 2, nyaris celaka 3, bonus risiko tinggi 3, bonus usulan diterapkan 3, bonus konsisten empat minggu 5, laporan ganda 0). Level Perunggu, Perak, Emas. Katalog hadiah dan penukaran diproses admin. |
| Statistik | KPI (laporan masuk, partisipasi, waktu penutupan, penutupan tepat waktu, risiko tinggi terbuka), tren 12 bulan, sebaran risiko, peta panas area dan kategori, umur tindak lanjut, penutupan per area, pelapor teratas, kamus indikator. Filter bulan, tahun, rentang, dan area. Ekspor PDF, PPTX (grafik asli yang dapat diedit), CSV, dan cetak. |
| Administrasi | Pengguna dan peran, area kerja (koordinat dan radius), katalog reward, penukaran poin, pengaturan alur (batas waktu, eskalasi, pengingat, nilai poin), jejak audit, audit acak laporan. |
| Pengingat otomatis | Endpoint `/api/cron/pengingat` untuk laporan yang melewati batas waktu (dijadwalkan harian, lihat `vercel.json`). |

Peran: Admin, Direksi, Manager, Superintendent, Pengawas. Menu tampil otomatis sesuai peran.

## Teknologi

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma 6 (SQLite lokal, Turso/libSQL untuk produksi), Auth.js 5 (Google), Chart.js, jsPDF, pptxgenjs, Playwright untuk uji ujung ke ujung.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env         # isi AUTH_SECRET, ADMIN_EMAILS, dan kredensial Google
npm run db:deploy            # membuat basis data SQLite dari migrasi
npm run db:seed              # data contoh: akun demo, area, katalog reward, laporan
npm run dev                  # http://localhost:3000
```

Dengan `DEMO_MODE="true"` halaman masuk menyediakan tombol masuk cepat sebagai akun contoh (Admin, Direksi, Manager, Superintendent, Pengawas) tanpa Google. Matikan di produksi.

## Mengaktifkan masuk dengan Google

1. Buka Google Cloud Console, buat OAuth client ID jenis Web application.
2. Authorized JavaScript origins: `https://DOMAIN` (dan `http://localhost:3000` untuk pengembangan).
3. Authorized redirect URIs: `https://DOMAIN/api/auth/callback/google`.
4. Isi `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, dan `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (nilai yang sama dengan client ID) pada `.env`.
5. Isi `ADMIN_EMAILS` dengan email Google admin program. Opsional, batasi domain dengan `ALLOWED_EMAIL_DOMAINS`.

Google One Tap menggunakan client ID yang sama. Di smartphone, One Tap otomatis menampilkan akun Google yang ada di perangkat dan masuk setelah ID token diverifikasi di server.

## Produksi

Basis data SQLite berbentuk berkas, sehingga cocok untuk server sendiri (VPS). Untuk Vercel atau platform tanpa penyimpanan berkas, gunakan Turso:

```bash
turso db create peduli
turso db show peduli --url      # TURSO_DATABASE_URL
turso db tokens create peduli   # TURSO_AUTH_TOKEN
# terapkan migrasi
for f in prisma/migrations/*/migration.sql; do turso db shell peduli < "$f"; done
```

Variabel lingkungan produksi: `DATABASE_URL="file:./dev.db"` (tetap diisi untuk Prisma), `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, `DEMO_MODE="false"`, `CRON_SECRET`.

Skrip `build` menjalankan `prisma generate` lalu `next build`. Foto disimpan di basis data (dikompresi di perangkat, maksimal 2 MB per foto) sehingga tidak memerlukan penyimpanan objek terpisah pada tahap uji coba.

## Uji ujung ke ujung

Dengan server berjalan di `http://localhost:3000` dan `DEMO_MODE="true"`:

```bash
npm run test:e2e
```

Skenario: Pengawas melapor dengan foto dan GPS, Superintendent memverifikasi, Manager memutuskan, perbaikan dan penutupan, poin dan penukaran, pemrosesan admin, ekspor PDF, PPTX, CSV, dan endpoint pengingat.

## Struktur

```
prisma/              skema, migrasi, seed
src/app/masuk        halaman masuk (Google, One Tap, demo)
src/app/(app)        halaman beraut: beranda, lapor, laporan, verifikasi, keputusan,
                     tindak-lanjut, poin, statistik, admin, notifikasi, profil, panduan
src/app/api          laporan (unggah), foto, cron pengingat, auth
src/lib              konstanta domain, alur kerja, poin, statistik, pengaturan
src/components       UI, kerangka tata letak, PWA, grafik
public/sw.js         service worker (cache app shell dan halaman luring)
```

## Acuan

Undang-Undang Nomor 1 Tahun 1970 tentang Keselamatan Kerja. Peraturan Pemerintah Nomor 50 Tahun 2012 tentang Penerapan SMK3. ISO 45001:2018. Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.
