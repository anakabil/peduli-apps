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

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma 6 dengan PostgreSQL (Prisma Postgres di Vercel), Auth.js 5 (Google), Chart.js, jsPDF, pptxgenjs, Playwright untuk uji ujung ke ujung.

## Menjalankan secara lokal

Memerlukan PostgreSQL (lokal atau layanan apa pun yang memberi URL `postgresql://`).

```bash
npm install
cp .env.example .env         # isi DATABASE_URL, AUTH_SECRET, ADMIN_EMAILS, kredensial Google
npm run db:deploy            # menerapkan migrasi (prisma migrate deploy)
npm run db:seed              # data contoh: akun demo, area, katalog reward, laporan
npm run dev                  # http://localhost:3000
```

Dengan `DEMO_MODE="true"` halaman masuk menyediakan tombol masuk cepat sebagai akun contoh (Admin, Direksi, Manager, Superintendent, Pengawas) tanpa Google. Matikan di produksi.

## Mengaktifkan masuk dengan Google

1. Buka Google Cloud Console, buat OAuth client ID jenis Web application.
2. Authorized JavaScript origins: `https://DOMAIN` (dan `http://localhost:3000` untuk pengembangan).
3. Authorized redirect URIs: `https://DOMAIN/api/auth/callback/google`.
4. Isi `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, dan `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (nilai yang sama dengan client ID).
5. Isi `ADMIN_EMAILS` dengan email Google admin program. Opsional, batasi domain dengan `ALLOWED_EMAIL_DOMAINS`.

Google One Tap menggunakan client ID yang sama. Di smartphone, One Tap otomatis menampilkan akun Google yang ada di perangkat dan masuk setelah ID token diverifikasi di server.

## Produksi di Vercel dengan Prisma Postgres

1. Impor repository ke Vercel sebagai proyek Next.js (preset bawaan sudah benar, perintah build `npm run build`).
2. Di tab Storage, pasang integrasi Prisma Postgres dan hubungkan ke proyek. Integrasi menyuntikkan `DATABASE_URL` (kode juga mengenali `PRISMA_DATABASE_URL`, `POSTGRES_URL`, dan `POSTGRES_PRISMA_URL`). Migrasi dijalankan otomatis saat build oleh `scripts/migrate.mjs`, yang memilih URL koneksi langsung bila tersedia (`DIRECT_URL`, `POSTGRES_URL_NON_POOLING`).
3. Tambahkan variabel lingkungan berikut di Settings, Environment Variables, lalu deploy ulang:

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `AUTH_SECRET` | ya | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | ya (kecuali demo) | Google OAuth, redirect URI `https://DOMAIN/api/auth/callback/google` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | disarankan | sama dengan `AUTH_GOOGLE_ID`, untuk One Tap di smartphone |
| `ADMIN_EMAILS` | ya | email Google yang otomatis menjadi Admin |
| `ALLOWED_EMAIL_DOMAINS` | opsional | misal `gys.co.id` |
| `DEMO_MODE` | opsional | `true` hanya saat uji coba, lalu `false` |
| `CRON_SECRET` | ya | rahasia acak; Vercel Cron mengirimnya otomatis pada jadwal di `vercel.json` |
| `SKIP_MIGRATE` | opsional | `true` bila migrasi ingin dijalankan manual |

Bila variabel wajib belum lengkap, halaman masuk menampilkan daftar periksa konfigurasi, bukan galat 500.

4. Data awal produksi (pengaturan alur, lima area contoh, katalog reward) tanpa akun demo:

```bash
vercel env pull .env.production.local
SEED_DEMO=false DATABASE_URL="<nilai DATABASE_URL produksi>" npm run db:seed
```

Area dan katalog dapat diubah kapan saja lewat menu Admin, sehingga langkah ini opsional. Admin pertama cukup masuk dengan email yang tercantum di `ADMIN_EMAILS`.

Foto disimpan di basis data (dikompresi di perangkat, maksimal 2 MB per foto, hanya JPEG, PNG, WebP). Untuk skala penuh, foto dapat dipindahkan ke penyimpanan objek tanpa mengubah alur.

## Uji ujung ke ujung

Dengan server berjalan di `http://localhost:3000` dan `DEMO_MODE="true"`:

```bash
npm run test:e2e
```

Skenario: Pengawas melapor dengan foto dan GPS, Superintendent memverifikasi, Manager memutuskan, perbaikan dan penutupan, poin dan penukaran, pemrosesan admin, ekspor PDF, PPTX, CSV, endpoint pengingat dengan rahasia, lima pengiriman bersamaan memperoleh nomor unik, pengiriman ulang antrean luring tidak menggandakan laporan, dan berkas non-gambar ditolak.

## Struktur

```
prisma/              skema, migrasi PostgreSQL, seed
scripts/migrate.mjs  memilih URL koneksi dan menjalankan prisma migrate deploy saat build
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
