# Daftar ikon PEDULI Apps

Dokumen ini berisi daftar ikon yang dibutuhkan aplikasi, lengkap dengan nama berkas dan prompt untuk dibuat di AI generator gambar. Nama berkas sudah disesuaikan dengan kode aplikasi, sehingga hasilnya dapat langsung dipasang tanpa penyesuaian.

Total 66 ikon dalam enam kelompok. Kelompok A dan B adalah prioritas pertama karena tampil di formulir lapor bahaya, halaman yang paling sering dibuka pengguna.

| Kelompok | Jumlah | Prioritas | Tampil di |
|---|---|---|---|
| A. Kategori bahaya | 6 | 1 | Formulir lapor, detail laporan, statistik |
| B. Jenis bahaya | 6 | 1 | Formulir lapor, detail laporan, statistik |
| C. Katalog reward | 30 | 2 | Halaman poin, katalog reward admin |
| D. Level poin | 3 | 2 | Kartu saldo poin |
| E. Ilustrasi keadaan | 6 | 3 | Halaman kosong, luring, menunggu persetujuan, laporan terkirim |
| F. Menu navigasi | 15 | 4 (opsional) | Menu samping dan menu bawah |

Tingkat risiko (Rendah, Sedang, Tinggi, Ekstrem) sengaja tidak dibuatkan ikon. Kode warna hijau, kuning, oranye, dan merah sudah menjadi bahasa matriks risiko yang dikenal pengguna, sehingga ikon tambahan justru berpotensi mengaburkan makna.

## 1. Gaya dan spesifikasi

Agar seluruh ikon tampak satu keluarga, tempelkan prompt gaya berikut di depan setiap prompt subjek.

Prompt gaya (kelompok A sampai E):

```
Premium 3D app icon, soft glossy clay render, rounded friendly shapes, vibrant but balanced colors with deep green #006042 as the accent color, soft studio lighting from the top left, gentle ambient occlusion, single centered object, isometric three-quarter view, plain transparent background, no text, no letters, no numbers, no logo, no border, no frame.
```

Prompt gaya kelompok F (menu navigasi, ikon kecil 20 sampai 24 piksel):

```
Minimal flat duotone app icon, simple bold geometric shapes, two colors only: deep green #006042 and mint #8fd1b5, thick rounded strokes, centered, plain transparent background, no text, no gradient, no shadow.
```

Kelompok F dibuat datar karena ikon 3D pada ukuran sekecil itu akan tampak ramai dan sulit dibaca. Prinsip ini juga menjadi praktik umum aplikasi kelas premium.

Spesifikasi berkas:

| Butir | Ketentuan |
|---|---|
| Format | PNG berlatar transparan, atau SVG bila AI mendukung |
| Ukuran | 512 x 512 piksel, rasio 1:1 |
| Ruang tepi | Objek mengisi sekitar 80% kanvas, sisakan ruang 10% di setiap sisi |
| Teks | Tanpa tulisan apa pun di dalam gambar |
| Nama berkas | Persis seperti kolom "Nama berkas", huruf kecil, tanpa spasi |
| Ilustrasi kelompok E | 800 x 600 piksel, rasio 4:3, latar transparan |

Kiat agar hasilnya seragam:

1. Buat satu kelompok sekaligus dalam satu sesi, dan pakai gambar pertama yang Bapak sukai sebagai referensi gaya (fitur style reference atau image reference) untuk gambar berikutnya.
2. Bila latar belum transparan, hapus latarnya dengan fitur remove background di AI yang sama, atau kirim apa adanya dan saya rapikan.
3. Simpan per kelompok dalam folder: `kategori`, `jenis`, `reward`, `level`, `ilustrasi`, `menu`.

## 2. Kelompok A. Kategori bahaya (prioritas 1)

| No | Nama berkas | Makna | Prompt subjek |
|---|---|---|---|
| A1 | kat-kondisi-tidak-aman.png | Kondisi tidak aman | a cracked steel floor plate with an exposed loose electrical cable and a yellow warning triangle standing beside it |
| A2 | kat-perilaku-tidak-aman.png | Perilaku tidak aman | a factory worker figure in a blue uniform without a hard hat, with a small red exclamation badge floating above the head |
| A3 | kat-near-miss.png | Near miss / nyaris celaka | a yellow hard hat with a falling steel bolt stopping just above it, dashed motion lines and a small orange alert spark |
| A4 | kat-ergonomi.png | Bahaya ergonomi | a worker figure lifting a heavy cardboard box with a bent back, the lower spine highlighted with a soft red glow |
| A5 | kat-pencemaran-lingkungan.png | Pencemaran lingkungan | a tipped industrial oil drum leaking dark liquid onto green grass with a small wilted leaf |
| A6 | kat-bencana-alam.png | Bencana alam | a cracked ground fissure under a dark storm cloud with a yellow lightning bolt and falling rain |

## 3. Kelompok B. Jenis bahaya (prioritas 1)

| No | Nama berkas | Makna | Prompt subjek |
|---|---|---|---|
| B1 | jenis-manusia.png | Manusia | bust of a factory worker wearing a white hard hat and a green high visibility vest, friendly face |
| B2 | jenis-peralatan.png | Peralatan | a large steel gear interlocked with a wrench, industrial machine part |
| B3 | jenis-material-berbahaya.png | Material berbahaya | a blue chemical drum with an orange diamond hazard label showing a flame symbol, a small spill puddle |
| B4 | jenis-metode-kerja.png | Metode kerja | a clipboard with a step by step checklist, three check marks and a curved arrow connecting the steps |
| B5 | jenis-lingkungan-kerja.png | Lingkungan kerja | a compact steel factory building with a chimney, a steel beam rack and soft smoke |
| B6 | jenis-kondisi-alam.png | Kondisi alam | a sun partly covered by a rain cloud with a thermometer and a gust of wind lines |

## 4. Kelompok C. Katalog reward (prioritas 2)

Nama berkas kelompok ini sama dengan kunci ikon yang sudah dipakai aplikasi, sehingga ikon Fluent yang ada sekarang akan tergantikan otomatis.

| No | Nama berkas | Makna | Prompt subjek |
|---|---|---|---|
| C1 | gift.png | Paket hadiah | a gift box wrapped in green paper with a gold satin ribbon bow |
| C2 | voucher.png | Voucer | a shopping gift voucher ticket with a perforated edge and a star stamp, blank, no text |
| C3 | card.png | Kartu belanja | a shopping gift card with a chip and a green wave pattern, blank, no text |
| C4 | money.png | Saldo atau tunai | a green money pouch tied with a string, gold coins spilling out, no currency symbol |
| C5 | shopping.png | Tas belanja | two paper shopping bags with handles, green and cream colors |
| C6 | grocery.png | Sembako | a woven basket filled with a rice sack, a cooking oil bottle, eggs and noodles, no labels |
| C7 | meal.png | Makan | an Indonesian rice box meal with rice, fried chicken, vegetables and sambal in a paper box |
| C8 | coffee.png | Kopi | a ceramic cup of hot black coffee on a saucer with soft steam |
| C9 | snack.png | Camilan | a jar of assorted snacks with cookies and wafer sticks |
| C10 | tumbler.png | Tumbler | a stainless steel insulated tumbler bottle with a green lid |
| C11 | umbrella.png | Payung | an open green and white umbrella |
| C12 | tshirt.png | Kaos | a folded green polo t-shirt, plain, no logo |
| C13 | jacket.png | Jaket | a dark green work jacket with reflective stripes |
| C14 | cap.png | Topi | a green baseball cap, plain, no logo |
| C15 | backpack.png | Tas ransel | a sturdy green backpack with side pockets |
| C16 | boots.png | Sepatu keselamatan | a pair of brown leather safety boots with steel toe caps and thick soles |
| C17 | helmet.png | Helm | a white industrial safety hard hat with a brim |
| C18 | goggles.png | Kacamata pelindung | clear safety goggles with a green elastic strap |
| C19 | gloves.png | Sarung tangan | a pair of yellow and grey work gloves |
| C20 | watch.png | Jam tangan | a modern wristwatch with a green strap |
| C21 | headphone.png | Headphone | over-ear wireless headphones, matte dark grey with green accents |
| C22 | powerbank.png | Power bank | a slim power bank with a charging cable and a small green battery indicator |
| C23 | phone.png | Pulsa atau ponsel | a smartphone with signal bars and a small plus coin floating beside it, blank screen |
| C24 | fuel.png | Voucer BBM | a fuel pump nozzle with a hose and a small fuel drop |
| C25 | bicycle.png | Sepeda | a green city bicycle |
| C26 | ball.png | Olahraga | a football with a pair of sports shoes |
| C27 | books.png | Buku | a small stack of hardcover books |
| C28 | trophy.png | Piala | a shiny gold trophy cup on a dark green base, blank plate |
| C29 | medal.png | Medali | a gold medal with a green ribbon, blank face |
| C30 | star.png | Penghargaan | a glowing gold star with small sparkles |

Catatan: C17 sengaja diganti menjadi helm keselamatan industri berwarna putih, karena ikon yang dipakai sekarang adalah helm penyelamat (rescue) yang kurang tepat untuk konteks pabrik.

## 5. Kelompok D. Level poin (prioritas 2)

| No | Nama berkas | Makna | Prompt subjek |
|---|---|---|---|
| D1 | level-perunggu.png | Level Perunggu | a bronze shield-shaped badge with a small check mark emblem and a ribbon, warm copper tone |
| D2 | level-perak.png | Level Perak | a silver shield-shaped badge with a check mark emblem, a ribbon and two small stars |
| D3 | level-emas.png | Level Emas | a gold shield-shaped badge with a check mark emblem, a ribbon, three stars and soft sparkles |

Ketiganya sebaiknya dibuat dari satu gambar dasar yang sama dan hanya diganti warnanya, agar terbaca sebagai satu jenjang.

## 6. Kelompok E. Ilustrasi keadaan (prioritas 3)

Ukuran 800 x 600 piksel. Prompt gaya tetap memakai gaya kelompok A sampai E, tetapi ganti frasa "single centered object" menjadi "small centered scene".

| No | Nama berkas | Dipakai saat | Prompt subjek |
|---|---|---|---|
| E1 | kosong-laporan.png | Daftar laporan masih kosong | an empty clipboard with a magnifying glass resting on it, a small green leaf |
| E2 | kosong-notifikasi.png | Belum ada notifikasi | a notification bell resting quietly on a soft cushion with small drifting cloud puffs |
| E3 | laporan-terkirim.png | Laporan berhasil dikirim | a paper plane flying out of a clipboard with a green check mark badge and confetti |
| E4 | luring.png | Perangkat tidak terhubung internet | a cloud with a broken wifi signal and a small smartphone below it |
| E5 | menunggu-persetujuan.png | Akun menunggu persetujuan admin | an hourglass next to an ID card with a hard hat on it |
| E6 | kosong-penukaran.png | Belum ada riwayat penukaran | an open empty gift box with a ribbon lying beside it |

## 7. Kelompok F. Menu navigasi (opsional)

Pakai prompt gaya kelompok F (datar dua warna). Ikon garis yang dipakai sekarang sudah memenuhi kaidah keterbacaan, jadi kelompok ini hanya perlu dibuat bila Bapak menginginkan identitas visual yang lebih khas.

| No | Nama berkas | Menu | Prompt subjek |
|---|---|---|---|
| F1 | menu-beranda.png | Beranda | a dashboard grid of four rounded tiles |
| F2 | menu-lapor.png | Lapor bahaya | a warning triangle with a plus sign |
| F3 | menu-laporan.png | Laporan | a clipboard with three lines |
| F4 | menu-verifikasi.png | Verifikasi | a shield with a check mark |
| F5 | menu-keputusan.png | Keputusan | a document with a stamp |
| F6 | menu-tindak-lanjut.png | Tindak lanjut | a wrench crossed with a screwdriver |
| F7 | menu-poin.png | Poin dan reward | a gift box with a star |
| F8 | menu-statistik.png | Statistik | a bar chart with a rising line |
| F9 | menu-panduan.png | Panduan | an open book |
| F10 | menu-pengguna.png | Pengguna | two person silhouettes |
| F11 | menu-area.png | Area kerja | a map pin over a folded map |
| F12 | menu-akuntabilitas.png | Akuntabilitas | an organization chart with three connected nodes |
| F13 | menu-katalog.png | Katalog reward | a package box with a tag |
| F14 | menu-penukaran.png | Penukaran poin | two arrows exchanging around a coin |
| F15 | menu-pengaturan.png | Pengaturan alur | a gear with a flow arrow |

## 8. Penyerahan berkas

1. Kumpulkan berkas per folder kelompok seperti pada bagian 1.
2. Kirim melalui salah satu cara berikut: unggah ke folder Google Drive lalu sebutkan nama foldernya, atau lampirkan langsung di percakapan.
3. Saya akan merapikan latar, menyeragamkan ukuran dan ruang tepi, mengonversi ke WebP agar ringan, lalu memasangnya di aplikasi dan menguji tampilannya di ponsel dan desktop.

Bila hasil dari AI lain dipakai, pastikan ketentuan layanannya mengizinkan penggunaan komersial, karena ikon akan dipakai di aplikasi klien (PT Garuda Yamato Steel).
