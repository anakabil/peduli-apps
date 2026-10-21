# Panduan Deploy Manual PEDULI Apps di Vercel

Panduan ini untuk proyek Vercel `peduli-apps` dengan database Prisma Postgres yang sudah terpasang.
Kerjakan berurutan. Setiap tahap diakhiri dengan cara memastikan hasilnya.

## Tahap 0. Periksa sambungan Git dan branch produksi

1. Buka proyek `peduli-apps` di Vercel, lalu Settings, Git.
2. Pastikan repository yang tersambung adalah `anakabil/peduli-apps`.
3. Pada Production Branch, isi `claude/eloquent-lovelace-6v1hoc`. Ini satu-satunya branch di repository dan berisi versi terbaru.
4. Simpan.

Bila branch produksi diisi `main`, setiap push akan menjadi deployment Preview, bukan Production.

## Tahap 1. Variabel lingkungan wajib

Tiga variabel database dari integrasi Prisma Postgres (`DATABASE_URL`, `POSTGRES_URL`, `PRISMA_DATABASE_URL`) sudah benar. Jangan diubah atau dihapus.

Buat dua string acak. Di Windows, buka PowerShell dan jalankan perintah berikut dua kali:

```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

Di Mac atau Linux: `openssl rand -base64 32`.

Lalu buka Settings, Environment Variables, Add Environment Variable. Untuk setiap baris, centang Production dan Preview, dan isi nilai tanpa tanda kutip:

| Key | Value | Keterangan |
| --- | --- | --- |
| `AUTH_SECRET` | hasil acak pertama | Kunci sesi login. Jangan dibagikan. |
| `CRON_SECRET` | hasil acak kedua | Kunci pengingat otomatis harian. Vercel Cron mengirimnya sendiri. |
| `ADMIN_EMAILS` | `m.reza.086@gmail.com` | Email Google yang otomatis menjadi Admin. Beberapa email dipisah koma. |
| `DEMO_MODE` | `true` atau `false` | `true` hanya bila akan memakai akun demo (lihat Tahap 3). |

## Tahap 2. Redeploy dan periksa log build

1. Buka tab Deployments, klik titik tiga pada deployment teratas, lalu Redeploy.
2. Buka deployment yang sedang berjalan, lalu Build Logs. Pastikan ada baris berikut:
   - `[migrate] memakai DATABASE_URL (koneksi langsung)`
   - `All migrations have been successfully applied.`
   - `Compiled successfully`
3. Status deployment harus Ready.

Variabel baru hanya terbaca oleh deployment yang dibuat setelah variabel disimpan.

## Tahap 3. Isi data awal database

Database produksi masih kosong. Pilih salah satu.

Opsi A, tanpa data contoh (disarankan untuk pemakaian nyata). Langsung lanjut ke Tahap 4 dengan `DEMO_MODE=false`. Setelah Admin masuk dengan Google, isi area kerja di menu Area kerja dan hadiah di menu Katalog reward.

Opsi B, dengan akun demo dan 48 laporan contoh (untuk presentasi). Tombol Mode demo hanya berfungsi setelah langkah ini. Data contoh akan tetap ada di database produksi.

Opsi B dan pengisian data master memerlukan Node.js 20 atau lebih baru di komputer Bapak:

```powershell
git clone https://github.com/anakabil/peduli-apps.git
cd peduli-apps
git checkout claude/eloquent-lovelace-6v1hoc
npm install
```

Salin nilai `DATABASE_URL` dari Vercel (Storage, pilih database, tab .env.local, atau Settings, Environment Variables, ikon mata pada `DATABASE_URL`). Lalu:

```powershell
# Opsi B: akun demo, area, katalog reward, dan laporan contoh
$env:DATABASE_URL="<tempel nilai DATABASE_URL>"
npm run db:seed

# Atau hanya data master (pengaturan, 5 area contoh, katalog reward), tanpa akun demo
$env:DATABASE_URL="<tempel nilai DATABASE_URL>"
$env:SEED_DEMO="false"
npm run db:seed

# Pemeriksaan integritas data (hanya membaca), hasil akhir harus "Seluruh invarian terpenuhi."
npm run db:audit
```

Di Mac atau Linux, ganti `$env:NAMA="nilai"` dengan `export NAMA="nilai"`.

## Tahap 4. Pastikan halaman masuk berjalan

Buka alamat produksi, misalnya `https://peduli-apps.vercel.app/masuk` (alamat pasti ada di Settings, Domains).

| Yang tampil | Arti dan tindakan |
| --- | --- |
| Halaman masuk dengan logo PEDULI | Berhasil. |
| Tombol Mode demo, lalu bisa masuk sebagai akun contoh | Opsi B berhasil. |
| Tombol Mode demo, tetapi muncul "Akun tidak dikenali" | Seed demo belum dijalankan (Tahap 3 Opsi B). |
| Kotak "Google OAuth belum dikonfigurasi" | Normal sebelum Tahap 5. |
| Halaman "Konfigurasi belum lengkap" | Buka bagian "Diagnosis deploy ini". Variabel bertanda kosong belum terbaca: periksa nama, centang lingkungan, lalu Redeploy. |

## Tahap 5. Masuk dengan akun Google

1. Buka https://console.cloud.google.com, buat atau pilih proyek.
2. APIs and Services, OAuth consent screen: pilih External, isi nama aplikasi `PEDULI Apps` dan email dukungan. Tambahkan email pengguna uji di Test users, atau Publish app agar semua akun Google bisa masuk.
3. Credentials, Create Credentials, OAuth client ID, jenis Web application:
   - Authorized JavaScript origins: `https://ALAMAT-PRODUKSI`
   - Authorized redirect URIs: `https://ALAMAT-PRODUKSI/api/auth/callback/google`
4. Salin Client ID dan Client Secret, lalu tambahkan di Vercel (Production dan Preview):

| Key | Value |
| --- | --- |
| `AUTH_GOOGLE_ID` | Client ID |
| `AUTH_GOOGLE_SECRET` | Client Secret |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID yang sama (untuk Google One Tap di smartphone) |
| `ALLOWED_EMAIL_DOMAINS` | opsional, misalnya domain email perusahaan; kosongkan bila belum perlu |

5. Redeploy, lalu masuk dengan akun Google Bapak. Karena tercantum di `ADMIN_EMAILS`, akun langsung aktif sebagai Admin.
6. Pengguna lain yang masuk akan berstatus menunggu. Admin menetapkan peran, area, dan atasan di menu Pengguna. Akun juga bisa dibuat lebih dulu oleh Admin; perannya tidak akan berubah saat pemiliknya pertama kali masuk dengan Google.

Bila memasang domain sendiri, tambahkan domain itu juga ke origins dan redirect URI di Google.

## Tahap 6. Sebelum dipakai GYS

1. Ubah `DEMO_MODE` menjadi `false`, lalu Redeploy.
2. Pastikan Settings, Cron Jobs menampilkan `/api/cron/pengingat` terjadwal `0 1 * * *` (pukul 08.00 WIB).
3. Jalankan `npm run db:audit` secara berkala, misalnya setiap bulan.

## Penanganan masalah

| Gejala | Penyebab | Tindakan |
| --- | --- | --- |
| Build gagal dengan `P1001` atau `Can't reach database` | Variabel database hilang atau integrasi terputus | Storage, sambungkan ulang Prisma Postgres ke proyek, Redeploy. |
| Build gagal di langkah migrate dengan `P3009` | Migrasi sebelumnya gagal setengah jalan | Kirim log build lengkap untuk ditelusuri; jangan reset database. |
| Google menampilkan `redirect_uri_mismatch` | Redirect URI tidak sama persis | Periksa `https`, alamat, dan akhiran `/api/auth/callback/google`. |
| "Email Anda tidak termasuk domain yang diizinkan" | `ALLOWED_EMAIL_DOMAINS` membatasi | Tambahkan domain, atau daftarkan email itu lewat menu Pengguna. |
| Halaman "Menunggu persetujuan admin" | Akun baru belum disetujui | Admin mengubah status menjadi Aktif di menu Pengguna. |
| Galat 500 pada halaman tertentu | Galat saat aplikasi berjalan | Buka tab Logs di Vercel, salin pesan galatnya. |

## Region fungsi dan basis data

Basis data Prisma Postgres proyek ini berada di region `sin1` (Singapura). Fungsi aplikasi dipaku ke region yang sama melalui `vercel.json` (`"regions": ["sin1"]`). Bila region fungsi berbeda dari region basis data, setiap kueri harus menyeberang antarbenua dan halaman terasa lambat. Bila suatu saat basis data dipindahkan, sesuaikan nilai `regions` dengan region basis data yang baru.
