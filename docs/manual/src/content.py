from lib import Doc, ui, path
from flow import symbol
import diagrams

V = "1.1.0"
EDISI = "Edisi 2, November 2026"
NODOK = "NS-PDL-MAN-001"
URL = "peduli-apps.vercel.app"
CK = "&#10003;"


def build():
    d = Doc()

    # ------------------------------------------------------------ BAB 1
    d.chapter(1, "Pendahuluan", "Bab ini menjelaskan tujuan manual, siapa pembacanya, cara membacanya, dan konvensi penulisan yang dipakai di seluruh dokumen.")
    d.in_chapter(["Tujuan dan ruang lingkup", "Sasaran pembaca", "Struktur manual", "Konvensi penulisan", "Dokumen terkait dan dasar penyusunan"])
    d.section("Tujuan dan ruang lingkup")
    d.p("Manual ini memandu pengguna menjalankan PEDULI Apps (Pelaporan Bahaya dan Upaya Pengendalian) di lingkungan PT Garuda Yamato Steel, mulai dari masuk ke aplikasi, melaporkan bahaya, memverifikasi dan memutuskan laporan, menindaklanjuti perbaikan, sampai menyajikan statistik program kepada pimpinan. Isinya mengikuti perilaku aplikasi pada versi " + V + ". Setiap langkah ditulis dari sudut pandang pengguna di depan layar, dengan gambar layar yang diambil langsung dari aplikasi.",
        "Manual ini tidak membahas teori identifikasi bahaya dan penilaian risiko secara mendalam. Kebijakan, prosedur, dan kriteria risiko perusahaan tetap merujuk pada dokumen sistem manajemen K3 PT Garuda Yamato Steel. Aplikasi berperan sebagai sarana pencatatan, pengendalian alur kerja, dan pengukuran kinerja program.")
    d.section("Sasaran pembaca")
    d.p("Manual ini ditulis untuk lima kelompok pengguna yang sesuai dengan lima peran di dalam aplikasi. Setiap kelompok tidak perlu membaca seluruh bab. Tabel berikut menunjukkan bab yang paling relevan bagi masing-masing.")
    d.table("Bab yang disarankan menurut peran pengguna", ["Peran", "Tugas utama di aplikasi", "Bab yang disarankan"], [
        ["Pengawas", "Melaporkan bahaya, memantau status laporan, menjadi penanggung jawab perbaikan, menukar poin", "Bab 2, 3, 6, 8, 9, 10, 11, dan 14"],
        ["Superintendent", "Memverifikasi laporan Pengawas, memverifikasi hasil perbaikan", "Bab 3 sampai 9, 11, dan 14"],
        ["Manager", "Memutuskan laporan, menetapkan penanggung jawab dan target, menutup perbaikan, menjawab konsultasi", "Bab 3 sampai 9, 11 sampai 13, dan 14"],
        ["Direksi", "Membaca statistik dan klasemen, menjawab konsultasi sebagai pengurus", "Bab 2, 3, 5, 11, dan 12"],
        ["Admin (tim HSE)", "Mengelola akun, area, katalog reward, pengaturan alur, menyaring konsultasi, membaca jejak audit", "Bab 3, 4, 11, 12, 13, dan 14"],
    ], widths=["20%", "48%", "32%"])
    d.section("Struktur manual")
    d.p("Susunan bab mengikuti urutan kerja yang lazim pada manual aplikasi. Bagian awal memperkenalkan aplikasi dan cara memulai. Bagian tengah membahas alur kerja inti secara berurutan, dari laporan sampai penutupan. Bagian akhir memuat layanan konsultasi, statistik, administrasi, pemecahan masalah, dan lampiran rujukan cepat.")
    d.table("Peta isi manual", ["Bab", "Judul", "Isi pokok"], [
        ["1 sampai 3", "Pendahuluan, Mengenal PEDULI, Memulai", "Prinsip program, jenis dan sumber bahaya, cara masuk, pemasangan di ponsel, anatomi layar, pilihan bahasa"],
        ["4 dan 5", "Peran dan Hak Akses, Alur Kerja", "Lima peran, pemisahan tugas, diagram alir proses menurut notasi baku"],
        ["6 sampai 8", "Melapor, Verifikasi dan Keputusan, Tindak Lanjut", "Prosedur kerja harian dari laporan sampai penutupan"],
        ["9 dan 10", "Notifikasi dan Profil, Poin dan Reward", "Notifikasi ponsel, pilihan jenis notifikasi, aturan poin, penukaran"],
        ["11 dan 12", "Layanan Konsultasi K3, Statistik", "Konsultasi kepada pengurus, indikator kinerja, klasemen, ekspor"],
        ["13 dan 14", "Administrasi, Pemecahan Masalah", "Akun dan penghapusannya, area, pengaturan, jejak audit, data uji coba, solusi masalah umum"],
        ["Lampiran", "A sampai C", "Acuan per fitur, glosarium, data dan privasi"],
    ], widths=["16%", "34%", "50%"])
    d.section("Konvensi penulisan")
    d.p("Agar petunjuk mudah diikuti, manual ini memakai gaya penulisan yang seragam. Konvensi ini mengikuti praktik dokumentasi perangkat lunak dan ketentuan ISO/IEC/IEEE 26514:2022 tentang perancangan informasi bagi pengguna.")
    d.table("Konvensi penulisan dalam manual", ["Penulisan", "Arti"], [
        [ui("Kirim laporan"), "Nama tombol, tab, menu, atau kolom persis seperti yang tertulis di layar"],
        [path("Pengaturan alur", "Data uji coba"), "Urutan menu atau tab yang perlu ditekan, dari kiri ke kanan"],
        ["Prosedur 6.1", "Rangkaian langkah bernomor yang dikerjakan berurutan, diakhiri keterangan hasil yang diharapkan"],
        ["Gambar 6.1, Tabel 6.1", "Gambar layar dan tabel diberi nomor menurut bab"],
        ["Diagram Alir 1", "Diagram proses dengan simbol ISO 5807, dinomori berurutan untuk seluruh manual"],
        ["PIC", "Penanggung jawab perbaikan (person in charge)"],
    ], widths=["32%", "68%"])
    d.p("Selain itu, manual memakai empat jenis kotak keterangan berikut.")
    d.note("catatan", "Informasi tambahan yang membantu memahami perilaku aplikasi.")
    d.note("tips", "Cara kerja yang lebih cepat atau praktik baik yang disarankan.")
    d.note("perhatian", "Hal yang perlu diperhatikan agar data tidak keliru atau pekerjaan tidak terhambat.")
    d.note("peringatan", "Tindakan yang tidak dapat dibatalkan atau berdampak pada data orang lain.")
    d.section("Dokumen terkait dan dasar penyusunan")
    d.p("Manual ini disusun dengan memperhatikan ketentuan dan praktik berikut. Daftar lengkapnya terdapat pada bagian Daftar Pustaka.")
    d.ul([
        "Undang-Undang Nomor 1 Tahun 1970 tentang Keselamatan Kerja, terutama kewajiban pengurus dan hak tenaga kerja atas syarat keselamatan kerja.",
        "Peraturan Pemerintah Nomor 50 Tahun 2012 tentang Penerapan SMK3, terutama elemen penetapan kebijakan, perencanaan, pelaksanaan, serta pemantauan dan evaluasi kinerja K3.",
        "SNI ISO 45001:2018, terutama klausul 5.1 tentang kepemimpinan dan komitmen, 5.4 tentang konsultasi dan partisipasi pekerja, 6.1.2 tentang identifikasi bahaya, 8.1.2 tentang hierarki pengendalian, dan 9.1 tentang pemantauan dan pengukuran.",
        "ISO/IEC/IEEE 26514:2022 tentang perancangan informasi bagi pengguna perangkat lunak, sebagai acuan struktur dan konvensi manual.",
        "ISO 5807:1985 tentang simbol dan konvensi diagram alir, sebagai notasi Diagram Alir 1 sampai 5.",
        "Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, sebagai dasar pengelolaan data pengguna.",
        "Ejaan Bahasa Indonesia yang Disempurnakan Edisi V sebagai pedoman bahasa.",
    ])
    d.end_chapter()

    # ------------------------------------------------------------ BAB 2
    d.chapter(2, "Mengenal PEDULI", "Gambaran umum PEDULI: untuk apa aplikasi ini dibuat, prinsip yang dipegang program, cara bahaya digolongkan, dan cara data dijaga.")
    d.in_chapter(["Apa itu PEDULI", "Prinsip program", "Jenis dan sumber bahaya", "Tingkat risiko awal", "Keamanan dan kerahasiaan data"])
    d.section("Apa itu PEDULI")
    d.p("PEDULI adalah aplikasi web progresif untuk melaporkan bahaya di tempat kerja dan mengawal upaya pengendaliannya sampai tuntas. Aplikasi ini menyatukan seluruh siklus dalam satu tempat: laporan dari lapangan dengan foto dan lokasi, verifikasi oleh Superintendent, keputusan dan penugasan oleh Manager, pelaksanaan perbaikan oleh penanggung jawab, verifikasi penutupan, sampai statistik untuk pimpinan.",
        "Siklus tersebut selaras dengan proses identifikasi bahaya dan pengendalian risiko pada PP 50/2012 dan SNI ISO 45001:2018. Laporan yang dibuat pekerja menjadi masukan identifikasi bahaya, keputusan Manager menetapkan pengendalian menurut hierarki, dan statistik menjadi bahan pemantauan serta tinjauan manajemen.")
    d.section("Prinsip program")
    d.p("Program PEDULI dijalankan dengan lima prinsip yang juga tercermin pada perilaku aplikasi.")
    d.table("Prinsip program PEDULI", ["Prinsip", "Penerapan di aplikasi"], [
        ["Kualitas di atas jumlah", "Poin baru diberikan setelah laporan dinyatakan valid. Laporan ganda atau tidak sesuai fakta tidak memperoleh poin"],
        ["Tidak mencari kesalahan", "Formulir menegaskan bahwa pelaporan bertujuan memperbaiki kondisi kerja. Statistik menonjolkan pelapor yang aktif, bukan yang belum melapor"],
        ["Kerahasiaan", "Laporan hanya dibuka oleh pihak yang menindaklanjuti. Penanya konsultasi dapat merahasiakan namanya dari pengurus"],
        ["Transparan dan terukur", "Laporan yang ditolak tetap tercatat, dapat dibuka, dan dihitung pada statistik beserta alasannya"],
        ["Kepemimpinan", "Pertanyaan pekerja dijawab langsung oleh pengurus melalui layanan konsultasi K3"],
    ], widths=["28%", "72%"])
    d.p("Prinsip tidak mencari kesalahan sejalan dengan konsep budaya adil (just culture) yang menempatkan pelaporan sebagai sumber pembelajaran organisasi (Reason, 1997). Rasio kejadian nyaris celaka terhadap cedera yang dikemukakan Bird dan Germain (1985) juga menjadi alasan laporan near miss diberi poin lebih tinggi.")
    d.section("Jenis dan sumber bahaya")
    d.p("Setiap laporan menggolongkan bahaya dari dua sisi. Jenis bahaya menjawab bentuk bahaya yang ditemukan, sedangkan sumber bahaya menjawab asal bahaya tersebut. Kedua penggolongan ini dipakai bersama pada statistik sehingga pola bahaya dapat dianalisis per area.")
    d.table("Jenis bahaya", ["Jenis bahaya", "Pengertian dan contoh"], [
        ["Kondisi tidak aman", "Keadaan tempat kerja, peralatan, atau bahan yang berpotensi menimbulkan cedera. Contoh: kabel terkelupas, lantai licin, pagar pengaman lepas"],
        ["Perilaku tidak aman", "Tindakan orang yang menyimpang dari prosedur atau praktik aman. Contoh: tidak memakai APD, melepas pengaman mesin"],
        ["Near miss atau nyaris celaka", "Kejadian yang hampir menimbulkan cedera atau kerusakan. Contoh: tumpukan coil hampir jatuh saat dipindahkan"],
        ["Bahaya ergonomi", "Postur, beban, atau gerakan berulang yang dapat menimbulkan gangguan otot dan rangka"],
        ["Pencemaran lingkungan", "Tumpahan, emisi, atau limbah yang mencemari lingkungan kerja maupun sekitar"],
        ["Bencana alam", "Kondisi akibat gempa, banjir, angin kencang, atau petir yang mengancam keselamatan"],
    ], widths=["28%", "72%"])
    d.p("Sumber bahaya mengikuti kerangka analisis sebab yang lazim dipakai dalam pengendalian mutu, yaitu manusia, mesin, material, metode, dan lingkungan (Ishikawa, 1985), ditambah kondisi alam.")
    d.table("Sumber bahaya", ["Sumber bahaya", "Arah analisis"], [
        ["Manusia", "Pengetahuan, keterampilan, kelelahan, kepatuhan terhadap prosedur"],
        ["Peralatan / mesin", "Kondisi mesin, alat angkat, alat kerja, dan pengamannya"],
        ["Material", "Bahan baku, produk, bahan kimia, dan cara penyimpanannya"],
        ["Metode kerja", "Prosedur, izin kerja, urutan pekerjaan"],
        ["Lingkungan kerja", "Tata letak, penerangan, kebisingan, suhu, kebersihan"],
        ["Kondisi alam", "Cuaca dan fenomena alam di luar kendali tempat kerja"],
    ], widths=["28%", "72%"])
    d.section("Tingkat risiko awal")
    d.p("Pelapor menetapkan tingkat risiko awal berdasarkan perkiraan akibat terburuk yang wajar. Tingkat ini dapat diperbaiki saat verifikasi atau keputusan. Laporan risiko Tinggi dan Ekstrem dari Pengawas langsung diberitahukan kepada Manager area melalui eskalasi otomatis, sementara verifikasi tetap berjalan.")
    d.table("Tingkat risiko awal", ["Tingkat", "Gambaran akibat", "Perlakuan yang diharapkan"], [
        ['<span class="pill g">Rendah</span>', "Cedera ringan, cukup P3K", "Diperbaiki dalam kegiatan rutin"],
        ['<span class="pill y">Sedang</span>', "Perlu perawatan medis, kehilangan hari kerja", "Perbaikan terjadwal dengan penanggung jawab"],
        ['<span class="pill o">Tinggi</span>', "Cedera serius atau cacat tetap, kerusakan besar", "Eskalasi ke Manager, perbaikan prioritas"],
        ['<span class="pill r">Ekstrem</span>', "Potensi fatalitas atau kecelakaan massal", "Eskalasi segera, pertimbangkan penghentian pekerjaan"],
    ], widths=["18%", "40%", "42%"], first_bold=False)
    d.note("perhatian", "Bila bahaya mengancam jiwa saat itu juga, amankan area dan hubungi atasan atau tim tanggap darurat terlebih dahulu. Laporan di PEDULI dibuat setelah kondisi aman.")
    d.section("Keamanan dan kerahasiaan data")
    d.p("Pengguna masuk dengan akun Google perusahaan tanpa kata sandi tersendiri, dan hanya alamat surel yang diizinkan Admin yang dapat membuat akun. Foto laporan diambil dari kamera saat laporan dibuat. Lokasi GPS hanya dibaca ketika formulir laporan dibuka, tidak dilacak di luar itu. Setiap perubahan penting, seperti keputusan, pengaturan alur, dan pengelolaan akun, dicatat pada jejak audit beserta pelaku dan waktunya. Ringkasan pengelolaan data terdapat pada Lampiran C.")
    d.end_chapter()

    # ------------------------------------------------------------ BAB 3
    d.chapter(3, "Memulai", "Persiapan sebelum memakai aplikasi, cara masuk, pemasangan di ponsel, dan pengenalan bagian-bagian layar yang akan sering dipakai.")
    d.in_chapter(["Persyaratan sistem", "Masuk ke aplikasi", "Akun baru menunggu persetujuan", "Memasang PEDULI di ponsel", "Mengenal tampilan layar", "Tampilan ponsel", "Memilih bahasa", "Tentang aplikasi", "Keluar dari aplikasi"])
    d.section("Persyaratan sistem")
    d.p("PEDULI berjalan di peramban web sehingga tidak perlu diunduh dari toko aplikasi. Pastikan perangkat memenuhi kebutuhan berikut.")
    d.table("Kebutuhan perangkat dan jaringan", ["Komponen", "Kebutuhan"], [
        ["Ponsel", "Android dengan Google Chrome versi terbaru, atau iPhone dengan iOS 16.4 atau lebih baru (Safari)"],
        ["Komputer", "Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari versi terbaru"],
        ["Kamera dan lokasi", "Izin kamera dan lokasi diberikan kepada aplikasi untuk membuat laporan"],
        ["Jaringan", "Koneksi internet. Laporan yang dibuat tanpa sinyal disimpan di perangkat dan dikirim otomatis saat jaringan tersedia"],
        ["Alamat aplikasi", f"<b>{URL}</b>"],
        ["Akun", "Akun Google dengan alamat surel yang diizinkan Admin"],
    ], widths=["24%", "76%"])
    d.section("Masuk ke aplikasi")
    d.figure("masuk-desk", "Halaman masuk PEDULI")
    d.procedure("Masuk ke PEDULI", [f"Buka peramban dan kunjungi <b>{URL}</b>.", f"Tekan {ui('Masuk dengan akun Google')}.", "Pilih akun Google perusahaan Anda dan berikan persetujuan bila diminta.", "Tunggu sampai aplikasi membuka Beranda."],
                "Aplikasi membuka Beranda sesuai peran Anda. Bila akun baru pertama kali masuk, aplikasi menampilkan halaman Menunggu persetujuan.")
    d.note("tips", "Di ponsel Android, Google dapat menawarkan masuk sekali sentuh (One Tap) di bagian atas layar. Pilih akun Anda untuk masuk lebih cepat.")
    d.section("Akun baru menunggu persetujuan")
    d.p("Akun yang baru pertama kali masuk berstatus Menunggu. Pada keadaan ini aplikasi hanya menampilkan halaman Menunggu persetujuan beserta nama dan alamat surel Anda. Admin akan menetapkan peran, area kerja, dan atasan, lalu mengaktifkan akun. Setelah aktif, menu muncul otomatis sesuai peran dan Anda menerima notifikasi aktivasi. Alur lengkapnya digambarkan pada Diagram Alir 1 di Bab 4.")
    d.section("Memasang PEDULI di ponsel")
    d.p("PEDULI dapat dipasang di layar utama ponsel sehingga terbuka di jendela sendiri seperti aplikasi biasa, dapat dipakai saat sinyal lemah, dan dapat menampilkan notifikasi ponsel.")
    d.procedure("Memasang di Android", ["Buka <b>" + URL + "</b> dengan Google Chrome dan masuk.", f"Tekan {ui('Pasang aplikasi')} pada ajakan yang muncul, atau buka menu Chrome lalu pilih {ui('Instal aplikasi')}.", "Konfirmasi pemasangan."], "Ikon PEDULI muncul di layar utama dan laci aplikasi.")
    d.procedure("Memasang di iPhone", ["Buka <b>" + URL + "</b> dengan Safari dan masuk.", f"Tekan tombol {ui('Bagikan')} di bagian bawah layar.", f"Pilih {ui('Tambah ke Layar Utama')}, lalu {ui('Tambah')}.", "Buka PEDULI dari ikon di layar utama, bukan dari Safari."], "PEDULI terbuka di jendela sendiri dan notifikasi ponsel dapat diaktifkan.")
    d.note("perhatian", "Di iPhone, notifikasi ponsel hanya berfungsi bila PEDULI dibuka dari ikon di layar utama.")
    d.section("Mengenal tampilan layar")
    d.p("Setelah masuk, layar terbagi menjadi beberapa bagian tetap. Memahami bagian-bagian ini akan memudahkan mengikuti prosedur pada bab berikutnya.")
    d.figure("beranda-desk", "Tampilan utama PEDULI pada Beranda Pengawas")
    d.table("Bagian-bagian layar utama", ["Bagian", "Fungsi"], [
        ["Menu samping", f"Navigasi utama yang dikelompokkan menjadi Utama, Tugas, Program, dan Administrasi. Menu yang tampil menyesuaikan peran"],
        ["Kepala halaman", "Judul halaman yang sedang dibuka beserta keterangan singkat"],
        ["Lonceng notifikasi", "Pemberitahuan tugas, keputusan, dan status yang menunggu Anda, lengkap dengan jumlah yang belum dibaca"],
        [ui("IND / ENG"), "Pilihan bahasa tampilan di pojok kanan atas: Indonesia atau Inggris (Bab 3.7)"],
        ["Tombol i", "Tombol kecil di samping logo yang membuka halaman Tentang PEDULI (Bab 3.8)"],
        ["Nama dan peran", f"Membuka halaman {ui('Profil')}"],
        [ui("Keluar"), "Mengakhiri sesi di perangkat ini"],
        ["Kartu sapaan", f"Ringkasan tugas dan tombol {ui('Lapor bahaya')} untuk membuat laporan baru"],
        ["Kolom konsultasi", "Kolom ajakan Butuh konsultasi terkait SMK3? Tulis di sini... untuk bertanya kepada pengurus (Bab 11)"],
        ["Bilah progres", "Garis hijau tipis di tepi atas layar yang muncul saat halaman sedang dimuat; tunggu sampai garis hilang, tidak perlu mengetuk ulang"],
    ], widths=["26%", "74%"])
    d.section("Tampilan ponsel")
    d.p(f"Pada layar ponsel, menu samping berganti menjadi bilah menu di bagian bawah. Tombol hijau di tengah membuka formulir {ui('Lapor')}. Tombol {ui('Menu')} membuka lembar berisi seluruh menu sesuai peran beserta {ui('Profil dan akun')}.")
    d.figure("m-tiga", "Tampilan ponsel: Beranda, lembar Menu, dan daftar laporan")
    d.section("Memilih bahasa")
    d.p(f"PEDULI tersedia dalam bahasa Indonesia dan Inggris untuk mendukung personel asing di lingkungan perusahaan PMA. Tekan {ui('IND')} atau {ui('ENG')} di pojok kanan atas layar; di ponsel tombol ini ada di bilah atas, di samping lonceng. Pilihan tersimpan di perangkat dan di akun Anda.",
        "Seluruh menu, formulir, pesan, label status, ekspor statistik, serta notifikasi di aplikasi dan di ponsel mengikuti bahasa pilihan penerimanya. Isi yang diketik pengguna, seperti uraian bahaya, catatan, nama orang, dan nama area, tidak diterjemahkan.")
    d.figure("beranda-en-desk", "Beranda dalam bahasa Inggris setelah memilih ENG")
    d.section("Tentang aplikasi")
    d.p(f"Tombol {ui('i')} di samping logo, menu {ui('Tentang PEDULI')} di bagian bawah menu utama, dan tautan {ui('Tentang aplikasi')} di halaman masuk membuka halaman Tentang. Halaman ini memuat versi aplikasi, profil pengembang Nusa Safety beserta kontaknya, pengguna aplikasi, dan regulasi yang menjadi dasar acuan.")
    d.figure("tentang-desk", "Halaman Tentang PEDULI", width="62%")
    d.section("Keluar dari aplikasi")
    d.p(f"Tekan {ui('Keluar')} di kanan atas layar komputer, atau buka {path('Menu', 'Profil dan akun')} lalu {ui('Keluar')} di ponsel. Saat keluar, notifikasi ponsel untuk perangkat tersebut dilepas dari akun Anda.")
    d.note("perhatian", "Selalu keluar bila memakai perangkat bersama. Jangan berbagi akun dengan rekan kerja, karena setiap laporan dan keputusan dicatat atas nama pemilik akun.")
    d.end_chapter()

    # ------------------------------------------------------------ BAB 4
    d.chapter(4, "Peran dan Hak Akses", "Lima peran pengguna, wewenang masing-masing, aturan pemisahan tugas yang ditegakkan aplikasi, dan alur pembuatan akun.")
    d.in_chapter(["Lima peran pengguna", "Wewenang menurut peran", "Aturan pemisahan tugas", "Alur pembuatan akun dan akses"])
    d.section("Lima peran pengguna")
    d.p("Setiap akun memiliki satu peran. Peran menentukan menu yang tampil, data yang dapat dibaca, dan tindakan yang boleh dilakukan. Pembagian ini mengikuti prinsip penetapan peran, tanggung jawab, dan wewenang pada klausul 5.3 SNI ISO 45001:2018.")
    d.table("Lima peran di PEDULI", ["Peran", "Lingkup data", "Gambaran tugas"], [
        ["Pengawas", "Laporan yang dibuat atau ditanganinya", "Membuat laporan bahaya, memantau status, menjadi penanggung jawab perbaikan bila ditunjuk, menukar poin"],
        ["Superintendent", "Laporan bawahan, laporan di areanya, dan laporan yang ditanganinya", "Memverifikasi laporan Pengawas (valid, revisi, atau tolak) dan memverifikasi hasil perbaikan yang diverifikasinya"],
        ["Manager", "Seluruh laporan", "Memutuskan laporan, menetapkan penanggung jawab, target, dan sumber daya, menutup perbaikan, mengatur alur, menjawab konsultasi"],
        ["Direksi", "Seluruh laporan dan statistik", "Membaca statistik dan klasemen sebagai dasar kebijakan, menjawab konsultasi sebagai pengurus"],
        ["Admin (tim HSE)", "Seluruh data", "Mengelola akun, area, katalog reward, penukaran, pengaturan, menyaring konsultasi, memeriksa jejak audit"],
    ], widths=["18%", "30%", "52%"])
    d.section("Wewenang menurut peran")
    d.p("Tabel berikut meringkas wewenang yang paling sering ditanyakan. Tanda centang berarti peran tersebut dapat melakukan aktivitas itu melalui layar aplikasi versi " + V + ".")
    rows = [
        ["Membuat laporan bahaya", CK, CK, CK, CK, CK],
        ["Memverifikasi laporan Pengawas", "", CK + " atasan atau area", "", "", CK],
        ["Memutuskan laporan", "", "", CK + " bukan laporannya sendiri", "", CK],
        ["Memperbarui progres perbaikan", CK + " bila PIC", CK + " bila PIC", CK, "", CK],
        ["Memverifikasi dan menutup perbaikan", "", CK + " yang diverifikasinya", CK, "", CK],
        ["Menerima dan menukar poin", CK, CK, "menurut pengaturan", "menurut pengaturan", ""],
        ["Membaca statistik dan klasemen", "", "", CK, CK, CK],
        ["Mengajukan konsultasi K3", CK, CK, CK, CK, CK],
        ["Menyaring konsultasi", "", "", "", "", CK],
        ["Menjawab konsultasi", "", "", CK + " bila ditunjuk", CK + " bila ditunjuk", ""],
        ["Mengatur area kerja dan alur", "", "", CK, "", CK],
        ["Mengelola akun, reward, jejak audit, data uji", "", "", "", "", CK],
    ]
    d.table("Ringkasan wewenang menurut peran", ["Aktivitas", "Pengawas", "Superint.", "Manager", "Direksi", "Admin"], rows, widths=["32%", "12%", "15%", "15%", "13%", "13%"], first_bold=False, cls="matrix")
    d.section("Aturan pemisahan tugas")
    d.p("Aplikasi menegakkan beberapa aturan pemisahan tugas agar tidak ada satu orang yang melaporkan, menyetujui, sekaligus menilai pekerjaannya sendiri.")
    d.ul([
        "Laporan Pengawas wajib diverifikasi Superintendent sebelum diputuskan Manager. Aturan ini terkunci dan tidak dapat dimatikan.",
        "Manager tidak memutuskan laporannya sendiri. Laporan buatan Manager diputuskan oleh Manager lain bila pengaturan Tinjauan sesama Manager aktif.",
        "Superintendent hanya menutup perbaikan atas laporan yang ia verifikasi.",
        "Pertanyaan konsultasi disaring tim HSE sebelum diteruskan, dan hanya pengurus yang ditunjuk yang dapat menjawab.",
        "Keputusan, perubahan pengaturan, aktivasi akun, dan pembersihan data dicatat pada jejak audit.",
    ], ordered=True)
    d.note("catatan", "Bila sebuah tombol tidak tampak, kemungkinan besar peran Anda memang tidak memiliki wewenang tersebut atau laporan sedang berada pada tahap lain. Periksa status laporan atau hubungi Admin.")
    d.section("Alur pembuatan akun dan akses")
    d.p("Akun dibuat otomatis saat pengguna pertama kali masuk dengan Google, selama alamat surelnya diizinkan. Admin kemudian menetapkan peran, area, dan atasan sebelum akun dapat dipakai. Diagram berikut menggambarkan alurnya dengan notasi yang dijelaskan pada Bab 5.")
    d.diagram(diagrams.da_akun(), "Pembuatan akun dan akses pertama kali")
    d.end_chapter()

    # ------------------------------------------------------------ BAB 5
    d.chapter(5, "Alur Kerja Pelaporan Bahaya", "Alur kerja PEDULI dari hulu ke hilir, disajikan sebagai proses yang saling berinteraksi dengan notasi diagram alir baku dan kartu proses.")
    d.in_chapter(["Pendekatan proses", "Notasi diagram alir", "Proses utama", "Kartu proses", "Status laporan"])
    d.section("Pendekatan proses")
    d.p("PEDULI mengikuti siklus Plan, Do, Check, Act yang menjadi kerangka PP 50/2012 dan SNI ISO 45001:2018 (Health and Safety Executive, 2013). Pemetaan siklus tersebut terhadap fitur aplikasi adalah sebagai berikut.")
    d.add('<div class="pdca"><div class="c1"><div class="eyebrow small">PLAN, RENCANAKAN</div><b>Identifikasi bahaya</b><p>Laporan dari lapangan dengan jenis, sumber, dan risiko awal.</p></div>'
          '<div class="c2"><div class="eyebrow small">DO, LAKSANAKAN</div><b>Pengendalian</b><p>Keputusan Manager menurut hierarki, penanggung jawab, target, dan sumber daya.</p></div>'
          '<div class="c3"><div class="eyebrow small">CHECK, PERIKSA</div><b>Verifikasi</b><p>Verifikasi laporan, verifikasi hasil perbaikan, statistik, dan klasemen.</p></div>'
          '<div class="c4"><div class="eyebrow small">ACT, TINDAK LANJUTI</div><b>Peningkatan</b><p>Laporan berulang dianalisis, pengaturan dikalibrasi, konsultasi dijawab pengurus.</p></div></div>')
    d.section("Notasi diagram alir")
    d.p("Seluruh diagram alir dalam manual ini memakai simbol pada tabel berikut (International Organization for Standardization, 1985). Panah menunjukkan urutan, label Ya atau Tidak menunjukkan cabang keputusan, dan simpul berwarna hijau muda pada lajur Sistem PEDULI menandakan kegiatan yang dikerjakan otomatis oleh aplikasi.")
    d.table("Simbol diagram alir menurut ISO 5807", ["Simbol", "Nama", "Arti dalam manual ini"], [
        [symbol("terminal"), "Terminal", "Awal atau akhir suatu proses"],
        [symbol("process"), "Proses", "Kegiatan yang dilakukan pengguna atau sistem"],
        [symbol("decision"), "Keputusan", "Titik percabangan dengan jawaban Ya atau Tidak"],
        [symbol("data"), "Data", "Masukan data, misalnya isian formulir laporan"],
        [symbol("store"), "Data tersimpan", "Data yang disimpan di basis data dan dapat ditelusuri"],
        [symbol("predefined"), "Proses terdefinisi", "Proses yang dirinci pada diagram tersendiri"],
    ], widths=["24%", "24%", "52%"], first_bold=False, cls="sym")
    d.section("Proses utama")
    d.p("Diagram Alir 2 menggambarkan proses utama dari laporan sampai penutupan. Laporan Pengawas melalui jalur A, yaitu verifikasi Superintendent lalu keputusan Manager. Laporan dari Superintendent, Manager, dan Direksi melalui jalur B, langsung kepada Manager. Proses verifikasi dan keputusan dirinci pada Bab 7, sedangkan perbaikan dan penutupan pada Bab 8.")
    d.diagram(diagrams.da_utama(), "Proses utama pelaporan bahaya di PEDULI")
    d.section("Kartu proses")
    d.p("Kartu proses melengkapi diagram alir dengan unsur pemilik proses, masukan, keluaran, kriteria, dan informasi terdokumentasi. Kartu ini dapat dipakai sebagai bagian dari peta proses sistem manajemen K3 perusahaan.")
    d.table("Kartu proses PEDULI", ["Proses", "Pemilik", "Masukan", "Keluaran", "Kriteria", "Informasi terdokumentasi"], [
        ["Pelaporan", "Pelapor", "Temuan bahaya di lapangan", "Laporan dengan foto, lokasi, jenis, sumber, risiko", "Isian wajib lengkap, foto dari kamera", "Laporan, foto, koordinat"],
        ["Verifikasi", "Superintendent", "Laporan Pengawas", "Valid, revisi, atau tolak dengan alasan", "Dalam batas waktu verifikasi", "Catatan verifikasi, jejak laporan"],
        ["Keputusan", "Manager", "Laporan valid atau jalur B", "Persetujuan dengan hierarki, PIC, target", "Tidak memutuskan laporan sendiri", "Keputusan, sumber daya"],
        ["Perbaikan", "Penanggung jawab", "Penugasan", "Progres dan foto bukti", "Selesai sebelum target", "Riwayat progres"],
        ["Penutupan", "Manager atau Superintendent", "Pengajuan penutupan", "Laporan ditutup atau dikembalikan", "Hasil diverifikasi di lapangan", "Catatan penutupan"],
        ["Pemantauan", "Direksi dan Manager", "Seluruh laporan", "Statistik, klasemen, ekspor", "Ditinjau berkala", "Berkas PDF, PowerPoint, CSV"],
    ], widths=["14%", "15%", "17%", "20%", "17%", "17%"], cls="small")
    d.section("Status laporan")
    d.table("Status laporan", ["Status", "Arti", "Pihak yang ditunggu"], [
        ["Menunggu verifikasi", "Laporan Pengawas belum diverifikasi", "Superintendent"],
        ["Perlu revisi", "Superintendent meminta perbaikan isi laporan", "Pelapor"],
        ["Menunggu keputusan", "Laporan valid atau jalur B menunggu keputusan", "Manager"],
        ["Dalam perbaikan", "Laporan disetujui dan sedang dikerjakan", "Penanggung jawab"],
        ["Menunggu penutupan", "Perbaikan dilaporkan selesai", "Manager atau Superintendent"],
        ["Selesai", "Hasil perbaikan diterima dan laporan ditutup", "Tidak ada"],
        ["Ditolak", "Laporan tidak dilanjutkan dengan alasan tercatat", "Tidak ada, tetap tercatat pada statistik"],
    ], widths=["24%", "46%", "30%"])
    d.end_chapter()

    # ------------------------------------------------------------ BAB 6
    d.chapter(6, "Melaporkan Bahaya", "Cara membuat laporan bahaya dengan formulir lima bagian, melapor tanpa sinyal, memantau status, dan merevisi laporan.")
    d.in_chapter(["Sebelum melapor", "Formulir lima bagian", "Membuat laporan", "Melapor tanpa sinyal", "Memantau dan merevisi laporan"])
    d.section("Sebelum melapor")
    d.p("Laporan yang baik dapat langsung diverifikasi tanpa revisi. Pastikan kondisi aman, ambil foto yang memperlihatkan bahaya dan sekitarnya, dan tuliskan uraian yang menjawab apa bahayanya serta di mana tepatnya.")
    d.note("tips", "Ambil foto dari jarak yang memperlihatkan konteks lokasi, lalu satu foto dekat yang memperlihatkan bahaya dengan jelas. Satu laporan dapat memuat sampai tiga foto.")
    d.section("Formulir lima bagian")
    d.p(f"Formulir dibuka dengan tombol {ui('Lapor bahaya')} di Beranda atau tombol hijau di bilah bawah ponsel. Formulir terdiri atas lima bagian yang diisi dari atas ke bawah.")
    d.figure("m-lapor", "Formulir lapor bahaya pada ponsel, bagian 1 sampai 5")
    d.table("Isian formulir lapor bahaya", ["Bagian", "Isian", "Keterangan"], [
        ["1. Foto dan lokasi", "Foto, Lokasi", "Foto wajib dari kamera, maksimal tiga. Lokasi dipilih dari daftar area dan terisi otomatis dari GPS. Tombol putar memperbarui GPS"],
        ["2. Jenis dan sumber bahaya", "Jenis bahaya, Sumber bahaya", "Pilih satu jenis dan satu sumber (Bab 2.3)"],
        ["3. Uraian bahaya", "Uraian, Dampak, Tingkat risiko awal", "Uraian minimal 10 karakter. Dampak menjelaskan akibat yang dapat terjadi"],
        ["4. Usulan perbaikan", "Perbaikan cepat, Pencegahan, Penanggung jawab", "Tidak wajib. Usulan yang diterapkan memperoleh bonus poin saat penutupan"],
        ["5. Keterangan", "Tidak ada isian", "Penegasan bahwa laporan ditinjau Manager, tidak bertujuan menyalahkan, dan dijaga kerahasiaannya"],
    ], widths=["24%", "28%", "48%"])
    d.note("catatan", "Bila posisi GPS berada di luar radius lokasi yang dipilih, formulir menampilkan peringatan. Laporan tetap dapat dikirim dan ditandai Di luar area untuk ditinjau.")
    d.section("Membuat laporan")
    d.procedure("Membuat laporan bahaya", [
        f"Tekan {ui('Lapor bahaya')}. Izinkan akses kamera dan lokasi bila diminta.",
        f"Pada bagian 1, tekan {ui('Ambil foto')} dan potret bahaya. Periksa bahwa {ui('Lokasi')} sudah benar.",
        "Pada bagian 2, pilih satu jenis bahaya dan satu sumber bahaya.",
        "Pada bagian 3, tuliskan uraian dan dampak, lalu pilih tingkat risiko awal.",
        "Pada bagian 4, isi usulan perbaikan dan penanggung jawab bila ada.",
        f"Tekan {ui('Kirim laporan')}.",
    ], "Layar Laporan terkirim menampilkan nomor laporan dengan format PDL-tahunbulan-urutan, lalu aplikasi membuka detail laporan. Superintendent atau Manager menerima notifikasi tugas.")
    d.section("Melapor tanpa sinyal")
    d.p("Bila jaringan tidak tersedia saat laporan dikirim, aplikasi menyimpan laporan di perangkat dan menampilkan layar Tersimpan di perangkat. Laporan dikirim otomatis begitu sinyal kembali, dengan waktu pembuatan sesuai saat laporan dibuat. Pengiriman ulang tidak menggandakan laporan.")
    d.note("perhatian", "Jangan menghapus data peramban atau aplikasi sebelum laporan yang tersimpan terkirim, karena antrean luring tersimpan di perangkat.")
    d.section("Memantau dan merevisi laporan")
    d.p(f"Menu {ui('Laporan')} menampilkan laporan sesuai lingkup peran. Tab {ui('Semua')}, {ui('Berjalan')}, {ui('Selesai')}, dan {ui('Ditolak')} memisahkan laporan menurut status, dan tombol {ui('Filter')} menyaring menurut status, jenis bahaya, risiko, dan area. Laporan yang ditolak tetap dapat dibuka beserta alasannya.")
    d.figure("laporan-desk", "Daftar laporan dengan tab status, pencarian, dan filter")
    d.p("Detail laporan memuat foto, rincian bahaya, usulan perbaikan, verifikasi, keputusan, progres, dan jejak laporan berupa urutan kejadian beserta pelaku dan waktunya.")
    d.figure("detail-desk", "Halaman detail laporan dengan jejak laporan")
    d.procedure("Merevisi laporan", [f"Buka notifikasi Perlu revisi atau tab {ui('Berjalan')}, lalu buka laporan.", "Baca catatan Superintendent pada kotak Perbaiki dan kirim ulang.", "Perbaiki jenis bahaya, risiko awal, keterangan lokasi, uraian, atau usulan perbaikan.", f"Isi {ui('Catatan revisi')} dan tekan tombol kirim."], "Laporan kembali berstatus Menunggu verifikasi dan Superintendent menerima notifikasi revisi.")
    d.end_chapter()

    # ------------------------------------------------------------ BAB 7
    d.chapter(7, "Verifikasi dan Keputusan", "Cara Superintendent memverifikasi laporan Pengawas dan cara Manager memutuskan laporan, menetapkan pengendalian, penanggung jawab, dan target.")
    d.in_chapter(["Antrean verifikasi", "Memverifikasi laporan", "Eskalasi risiko tinggi", "Antrean keputusan", "Memutuskan laporan", "Alur verifikasi dan keputusan"])
    d.section("Antrean verifikasi")
    d.p(f"Menu {ui('Verifikasi')} menampilkan laporan Pengawas yang menunggu verifikasi Anda, diurutkan dari yang paling lama. Laporan yang melewati batas waktu ditandai.")
    d.figure("verifikasi-desk", "Antrean verifikasi Superintendent")
    d.section("Memverifikasi laporan")
    d.figure("panel-verifikasi", "Panel verifikasi laporan Pengawas", width="62%")
    d.procedure("Memverifikasi laporan", ["Buka laporan dari antrean verifikasi atau notifikasi.", "Periksa tiga butir: foto sesuai lokasi dan waktu, uraian bahaya jelas dan lengkap, dan bukan laporan ganda.", f"Pilih {ui('Valid')}, {ui('Revisi')}, atau {ui('Tolak')}. Untuk Tolak, pilih alasan penolakan.", f"Isi catatan, lalu tekan {ui('Simpan verifikasi')}."], "Laporan valid diteruskan kepada Manager dan pelapor memperoleh poin. Laporan revisi dikembalikan kepada pelapor. Laporan ditolak berhenti dengan alasan tercatat.")
    d.table("Hasil verifikasi", ["Hasil", "Akibat", "Notifikasi"], [
        ["Valid", "Status menjadi Menunggu keputusan, poin diberikan kepada pelapor", "Manager area dan pelapor"],
        ["Revisi", "Status menjadi Perlu revisi", "Pelapor"],
        ["Tolak", "Status menjadi Ditolak dengan alasan", "Pelapor"],
    ], widths=["16%", "54%", "30%"])
    d.table("Alasan penolakan laporan", ["Alasan", "Kapan dipakai"], [
        ["Tidak memerlukan tindakan", "Kondisi yang dilaporkan bukan bahaya atau sudah dikendalikan"],
        ["Laporan ganda", "Bahaya yang sama sudah dilaporkan dan sedang ditangani"],
        ["Laporan tidak sesuai fakta", "Foto atau uraian tidak sesuai kondisi di lapangan"],
    ], widths=["32%", "68%"])
    d.note("catatan", "Laporan yang ditolak tidak dihapus. Laporan tersebut tetap dapat dibuka pada tab Ditolak dan dihitung pada statistik menurut tahap dan alasan, sehingga keputusan penolakan dapat ditelaah.")
    d.section("Eskalasi risiko tinggi")
    d.p("Laporan Pengawas dengan risiko Tinggi atau Ekstrem langsung diberitahukan kepada Manager area dengan tanda Eskalasi, tanpa menunggu verifikasi. Hal yang sama berlaku bila risiko dinaikkan saat revisi. Verifikasi tetap dijalankan agar keputusan didasarkan pada laporan yang telah diperiksa.")
    d.section("Antrean keputusan")
    d.figure("keputusan-desk", "Antrean keputusan Manager")
    d.section("Memutuskan laporan")
    d.p("Keputusan menetapkan apakah laporan ditindaklanjuti, dengan pengendalian apa, oleh siapa, dan sampai kapan. Pilihan pengendalian mengikuti hierarki pada klausul 8.1.2 SNI ISO 45001:2018, diurutkan dari yang paling efektif.")
    d.figure("panel-keputusan", "Panel keputusan Manager", width="46%")
    d.table("Hierarki pengendalian", ["Urutan", "Pengendalian", "Contoh"], [
        ["1", "Eliminasi", "Menghilangkan sumber bahaya"],
        ["2", "Substitusi", "Mengganti dengan bahan atau cara yang lebih aman"],
        ["3", "Rekayasa teknik", "Memisahkan pekerja dari bahaya, misalnya pelindung mesin"],
        ["4", "Administratif", "Prosedur, rambu, izin kerja, pelatihan"],
        ["5", "APD", "Alat pelindung diri sebagai lapis terakhir"],
    ], widths=["12%", "26%", "62%"])
    d.procedure("Memutuskan laporan", ["Buka laporan dari antrean keputusan atau notifikasi.", "Tinjau foto, rincian bahaya, catatan verifikasi, dan usulan pelapor.", f"Pilih {ui('Setujui')}, lalu tetapkan {ui('Penanggung jawab')} dari pengguna terdaftar atau tulis manual.", "Isi sumber daya bila perlu (tenaga, biaya, material), target selesai, dan hierarki pengendalian.", f"Tekan {ui('Simpan keputusan')}."], "Status menjadi Dalam perbaikan. Penanggung jawab dan pelapor menerima notifikasi. Pada jalur B, poin pelapor diberikan saat keputusan ini.")
    d.note("tips", "Bila pengaturan Penanggung jawab per area aktif, Manager area diusulkan sebagai penanggung jawab bawaan. Usulan penanggung jawab dari pelapor juga ditampilkan bila diisi.")
    d.p(f"Untuk menolak, pilih {ui('Tolak')}, pilih alasan, dan isi {ui('Penjelasan untuk pelapor')}. Penjelasan ini disampaikan kepada pelapor melalui notifikasi.")
    d.section("Alur verifikasi dan keputusan")
    d.diagram(diagrams.da_verifikasi(), "Verifikasi dan keputusan laporan")
    d.end_chapter()

    # ------------------------------------------------------------ BAB 8
    d.chapter(8, "Tindak Lanjut dan Penutupan", "Cara penanggung jawab melaporkan kemajuan perbaikan dan cara Manager atau Superintendent memverifikasi hasilnya sampai laporan ditutup.")
    d.in_chapter(["Halaman tindak lanjut", "Memperbarui progres", "Verifikasi hasil dan penutupan", "Batas waktu dan pengingat", "Alur tindak lanjut"])
    d.section("Halaman tindak lanjut")
    d.p(f"Menu {ui('Tindak lanjut')} menampilkan laporan yang sedang diperbaiki dan yang menunggu penutupan, lengkap dengan progres dan target. Penanggung jawab melihat laporan yang ditugaskan kepadanya.")
    d.figure("tindaklanjut-desk", "Halaman tindak lanjut")
    d.section("Memperbarui progres")
    d.figure("panel-progres", "Panel pembaruan perbaikan", width="62%")
    d.procedure("Memperbarui progres perbaikan", ["Buka laporan dari halaman tindak lanjut.", f"Geser {ui('Progres')} sesuai kemajuan pekerjaan.", f"Isi {ui('Catatan')} tentang apa yang sudah dikerjakan dan tekan {ui('Ambil foto')} untuk foto bukti.", f"Tekan {ui('Simpan progres')}. Bila pekerjaan selesai, centang {ui('Perbaikan selesai, ajukan penutupan')} lalu tekan {ui('Ajukan penutupan')}."], "Progres tercatat pada jejak laporan. Pengajuan penutupan mengubah status menjadi Menunggu penutupan dan memberi tahu Manager serta Superintendent.")
    d.section("Verifikasi hasil dan penutupan")
    d.figure("panel-penutupan", "Panel verifikasi hasil dan penutupan", width="62%")
    d.procedure("Menutup laporan", ["Periksa hasil perbaikan di lapangan dan bandingkan dengan foto bukti.", f"Pilih {ui('Hasil diterima, tutup')} atau {ui('Belum diterima')}.", "Bila usulan pencegahan pelapor diterapkan, centang Tindakan pencegahan dari pelapor diterapkan.", f"Isi {ui('Catatan penutupan')} dan tekan {ui('Simpan')}."], "Laporan berstatus Selesai, pelapor menerima bonus usulan bila berlaku, dan penutupan tepat waktu dihitung pada statistik. Bila belum diterima, laporan kembali Dalam perbaikan dengan catatan untuk penanggung jawab.")
    d.section("Batas waktu dan pengingat")
    d.table("Batas waktu bawaan", ["Tahap", "Batas waktu", "Dihitung sejak"], [
        ["Verifikasi", "2 hari kerja", "Laporan dikirim"],
        ["Keputusan", "3 hari kerja", "Laporan terverifikasi atau dikirim pada jalur B"],
        ["Perbaikan", "Target yang ditetapkan Manager", "Keputusan"],
    ], widths=["24%", "34%", "42%"])
    d.p("Penjadwal harian mengirim pengingat kepada pihak yang ditunggu bila suatu tahap melewati batas waktu. Batas waktu dan pengingat dapat diubah pada Pengaturan alur (Bab 13).")
    d.section("Alur tindak lanjut")
    d.diagram(diagrams.da_perbaikan(), "Pelaksanaan perbaikan dan verifikasi penutupan")
    d.end_chapter()

    # ------------------------------------------------------------ BAB 9
    d.chapter(9, "Notifikasi dan Profil", "Pemberitahuan di dalam aplikasi, notifikasi di ponsel beserta pilihan jenisnya, dan halaman Profil.")
    d.in_chapter(["Notifikasi di dalam aplikasi", "Notifikasi ponsel", "Profil Saya"])
    d.section("Notifikasi di dalam aplikasi")
    d.p("Lonceng di bagian atas layar menunjukkan jumlah notifikasi yang belum dibaca. Halaman notifikasi memuat seluruh pemberitahuan beserta tautan ke laporan atau halaman terkait.")
    d.figure("notifikasi-desk", "Halaman notifikasi")
    d.section("Notifikasi ponsel")
    d.p("Notifikasi ponsel muncul di bilah notifikasi meskipun aplikasi tertutup, sehingga tugas verifikasi, keputusan, dan tindak lanjut tidak terlewat. Notifikasi perlu diaktifkan sekali pada setiap perangkat.")
    d.figure("m-profil-notif", "Kartu Notifikasi ponsel pada halaman Profil", width="40%")
    d.procedure("Mengaktifkan notifikasi ponsel", [f"Buka {ui('Profil')}, atau tekan {ui('Aktifkan')} pada ajakan di Beranda.", f"Pada kartu Notifikasi ponsel, tekan {ui('Aktifkan notifikasi')}.", f"Pilih {ui('Izinkan')} ketika ponsel meminta izin.", f"Tekan {ui('Kirim uji')} untuk memastikan notifikasi muncul."], "Perangkat menerima notifikasi uji. Ulangi prosedur ini pada setiap perangkat yang dipakai.")
    d.p(f"Di bawah kartu tersebut, centang jenis notifikasi yang ingin diterima lalu tekan {ui('Simpan pilihan')}. Jenis yang dimatikan oleh pengelola program ditandai dan tidak dapat diaktifkan.")
    d.table("Jenis notifikasi", ["Jenis", "Isi", "Penerima"], [
        ["Laporan perlu verifikasi", "Laporan baru atau revisi yang menunggu verifikasi", "Superintendent"],
        ["Laporan perlu keputusan", "Laporan yang menunggu keputusan Manager", "Manager"],
        ["Eskalasi risiko tinggi", "Laporan risiko Tinggi atau Ekstrem di area", "Manager area"],
        ["Penugasan tindak lanjut", "Ditunjuk sebagai penanggung jawab perbaikan", "Penanggung jawab"],
        ["Perkembangan tindak lanjut", "Perbaikan dilaporkan selesai atau perlu disempurnakan", "Manager, verifikator, penanggung jawab"],
        ["Status laporan saya", "Laporan diverifikasi, disetujui, ditolak, atau ditutup", "Pelapor"],
        ["Pengingat batas waktu", "Tahap yang melewati batas waktu", "Pihak yang ditunggu"],
        ["Konsultasi K3", "Pertanyaan baru, diteruskan, dan dijawab", "Tim HSE, pengurus, penanya"],
        ["Poin dan penukaran", "Penyesuaian poin dan status penukaran hadiah", "Penerima poin"],
        ["Administrasi", "Pengajuan penukaran dan aktivasi akun", "Admin dan pengguna terkait"],
    ], widths=["28%", "44%", "28%"])
    d.note("catatan", "Di iPhone, notifikasi ponsel memerlukan iOS 16.4 atau lebih baru dan PEDULI harus dibuka dari ikon Layar Utama (Bab 3.4).")
    d.note("tips", "Notifikasi dikirim dalam bahasa yang dipilih penerima. Manajer yang memilih ENG menerima notifikasi berbahasa Inggris, meskipun laporannya ditulis pelapor berbahasa Indonesia.")
    d.section("Profil Saya")
    d.p(f"Halaman {ui('Profil')} memuat identitas, peran, area, atasan, saldo dan level poin, nomor telepon, kartu notifikasi ponsel, jejak akses terakhir, tombol pemasangan aplikasi, dan tombol {ui('Keluar')}. Peran, area, dan atasan ditetapkan oleh Admin dan tidak dapat diubah sendiri.")
    d.end_chapter()

    # ------------------------------------------------------------ BAB 10
    d.chapter(10, "Poin dan Reward", "Aturan pemberian poin, jenjang level, dan cara menukar poin dengan hadiah dari katalog.")
    d.in_chapter(["Aturan poin", "Level pelapor", "Menukar poin", "Status penukaran"])
    d.section("Aturan poin")
    d.p("Poin menghargai laporan yang berkualitas. Nilai berikut adalah nilai bawaan dan dapat diubah Admin pada Pengaturan alur. Peran yang berhak menerima poin juga ditetapkan pada pengaturan tersebut.")
    d.table("Nilai poin bawaan", ["Jenis poin", "Nilai", "Diberikan saat"], [
        ["Laporan bahaya valid", "2", "Verifikasi valid (jalur A) atau keputusan disetujui (jalur B)"],
        ["Laporan nyaris celaka valid", "3", "Sama seperti di atas, menggantikan nilai laporan biasa"],
        ["Bonus risiko Tinggi atau Ekstrem", "3", "Bersamaan dengan poin laporan valid"],
        ["Bonus usulan perbaikan diterapkan", "3", "Penutupan dengan centang usulan diterapkan"],
        ["Bonus konsisten", "5", "Laporan valid pada empat minggu berturut-turut"],
    ], widths=["40%", "12%", "48%"])
    d.section("Level pelapor")
    d.table("Level menurut akumulasi poin", ["Level", "Akumulasi poin yang diperoleh"], [
        ["Perunggu", "0 sampai 49"], ["Perak", "50 sampai 149"], ["Emas", "150 ke atas"]], widths=["30%", "70%"])
    d.p("Level dihitung dari seluruh poin yang pernah diperoleh, sehingga tidak turun ketika poin ditukar.")
    d.section("Menukar poin")
    d.figure("poin-desk", "Halaman Poin dan reward dengan saldo, level, dan katalog hadiah")
    d.procedure("Menukar poin dengan hadiah", [f"Buka menu {ui('Poin dan reward')}.", f"Pilih hadiah pada Katalog hadiah, lalu tekan {ui('Tukar poin')}.", "Konfirmasi penukaran."], "Poin dikurangi, stok hadiah berkurang, dan pengajuan tampil pada Penukaran saya. Admin menerima notifikasi untuk memproses.")
    d.note("catatan", "Tombol tukar nonaktif bila saldo belum cukup atau stok habis. Keterangan pada tombol menunjukkan kekurangan poin.")
    d.section("Status penukaran")
    d.table("Status penukaran", ["Status", "Arti"], [
        ["Diajukan", "Menunggu diproses Admin"], ["Diproses", "Hadiah sedang disiapkan"], ["Selesai", "Hadiah telah diserahkan"], ["Ditolak", "Penukaran dibatalkan, poin dan stok dikembalikan otomatis"]], widths=["26%", "74%"])
    d.end_chapter()

    # ------------------------------------------------------------ BAB 11
    d.chapter(11, "Layanan Konsultasi K3", "Saluran bagi pekerja untuk bertanya langsung kepada pengurus tentang K3 dan SMK3, disaring tim HSE sebagai bentuk komitmen dan kepemimpinan.")
    d.in_chapter(["Tujuan layanan", "Mengajukan pertanyaan", "Penyaringan oleh tim HSE", "Jawaban pengurus", "Tanya jawab terbuka", "Alur layanan konsultasi"])
    d.section("Tujuan layanan")
    d.p("Undang-Undang Nomor 1 Tahun 1970 menempatkan pengurus sebagai pihak yang memimpin langsung tempat kerja dan bertanggung jawab atas syarat keselamatan kerja. SNI ISO 45001:2018 klausul 5.1 meminta manajemen puncak menunjukkan kepemimpinan dan komitmen, dan klausul 5.4 meminta organisasi menyediakan mekanisme konsultasi dan partisipasi pekerja. Layanan konsultasi K3 mewujudkan keduanya: pertanyaan pekerja sampai kepada pengurus dan dijawab langsung oleh pengurus.",
        "Tim HSE menyaring setiap pertanyaan sebelum diteruskan. Penyaringan memastikan pertanyaan relevan dengan K3, belum terjawab, dan disampaikan secara patut, sekaligus menambahkan konteks atau data yang membantu pengurus menjawab.")
    d.table("Status konsultasi", ["Status", "Arti"], [
        ["Disaring tim HSE", "Pertanyaan baru menunggu penyaringan"],
        ["Menunggu jawaban pengurus", "Pertanyaan telah diteruskan kepada pengurus yang ditunjuk"],
        ["Dijawab", "Pengurus telah menjawab dan jawaban dikirim kepada penanya"],
        ["Tidak diteruskan", "Tim HSE tidak meneruskan pertanyaan, dengan alasan dan arahan untuk penanya"],
    ], widths=["32%", "68%"])
    d.section("Mengajukan pertanyaan")
    d.p("Pertanyaan dapat diajukan dari kolom ajakan di Beranda atau dari menu Konsultasi K3.")
    d.figure("konsultasi-prompt", "Kolom ajakan konsultasi di Beranda")
    d.figure("konsultasi-tanya", "Tab Tanya berisi formulir pertanyaan dan daftar Pertanyaan saya")
    d.procedure("Mengajukan pertanyaan konsultasi", [f"Tekan kolom {ui('Butuh konsultasi terkait SMK3? Tulis di sini...')} di Beranda, atau buka menu {ui('Konsultasi K3')}.", f"Pilih {ui('Topik')}: kebijakan dan program K3, peralatan dan APD, prosedur dan izin kerja, lingkungan kerja, kesehatan kerja, pelatihan dan kompetensi, atau lainnya.", f"Tuliskan {ui('Pertanyaan')} dengan jelas, minimal 10 karakter.", f"Centang {ui('Rahasiakan nama saya dari pengurus')} bila diinginkan.", f"Tekan {ui('Kirim pertanyaan')}."], "Pertanyaan tampil pada Pertanyaan saya dengan status Disaring tim HSE. Jawaban pengurus dikirim melalui notifikasi.")
    d.note("catatan", "Pilihan merahasiakan nama hanya berlaku terhadap pengurus. Tim HSE tetap mengetahui penanya untuk keperluan tindak lanjut.")
    d.note("perhatian", "Bahaya yang perlu diperbaiki sebaiknya dilaporkan melalui Lapor bahaya, bukan melalui konsultasi, agar perbaikannya ditugaskan dan dipantau.")
    d.section("Penyaringan oleh tim HSE")
    d.p(f"Admin sebagai tim HSE membuka tab {ui('Penyaringan')}. Tab ini memuat tiga kelompok: menunggu penyaringan, menunggu jawaban pengurus, dan sudah dijawab.")
    d.figure("konsultasi-saring", "Tab Penyaringan untuk tim HSE")
    d.procedure("Menyaring dan meneruskan pertanyaan", ["Baca pertanyaan pada kelompok Menunggu penyaringan.", f"Untuk meneruskan, pilih {ui('Teruskan')}, tentukan {ui('Pengurus penjawab')} dari Direksi atau Manager, dan isi catatan bila perlu.", f"Tekan {ui('Teruskan')}.", f"Untuk tidak meneruskan, pilih {ui('Tidak diteruskan')}, pilih alasan, dan tulis penjelasan untuk penanya."], "Pertanyaan yang diteruskan pindah ke kelompok Menunggu jawaban pengurus dan pengurus menerima notifikasi. Penanya menerima kabar pada kedua keadaan.")
    d.table("Alasan tidak diteruskan", ["Alasan", "Arahan yang disarankan"], [
        ["Di luar lingkup K3", "Arahkan ke unit yang berwenang"],
        ["Sudah dijawab di Tanya jawab", "Sebutkan tanya jawab yang relevan"],
        ["Sebaiknya dilaporkan sebagai laporan bahaya", "Penanya mendapat tautan langsung ke Lapor bahaya"],
        ["Tidak sesuai etika komunikasi", "Sampaikan secara santun agar penanya dapat mengajukan ulang"],
    ], widths=["40%", "60%"])
    d.section("Jawaban pengurus")
    d.p(f"Pengurus yang ditunjuk membuka tab {ui('Perlu dijawab')}. Pertanyaan dengan nama yang dirahasiakan tampil sebagai Penanya dirahasiakan. Catatan tim HSE tampil sebagai konteks.")
    d.figure("konsultasi-jawab", "Tab Perlu dijawab untuk pengurus")
    d.procedure("Menjawab pertanyaan", ["Baca pertanyaan dan catatan tim HSE.", f"Tuliskan jawaban dan arahan tindak lanjut pada {ui('Jawaban Anda')}.", f"Tekan {ui('Kirim jawaban')}."], "Jawaban tampil pada pertanyaan dan dikirim kepada penanya. Tim HSE menerima pemberitahuan untuk meninjau jawaban.")
    d.note("tips", "Jawaban yang menyebutkan komitmen, tindakan, dan waktu yang jelas memperkuat kepercayaan pekerja terhadap pimpinan.")
    d.section("Tanya jawab terbuka")
    d.p(f"Tim HSE dapat menekan {ui('Tampilkan di Tanya jawab')} pada pertanyaan yang telah dijawab dan bermanfaat bagi seluruh pekerja. Tab {ui('Tanya jawab')} menampilkan pertanyaan dan jawaban tersebut tanpa nama penanya.")
    d.figure("konsultasi-terbuka", "Tab Tanya jawab terbuka")
    d.section("Alur layanan konsultasi")
    d.diagram(diagrams.da_konsultasi(), "Layanan konsultasi K3")
    d.end_chapter()

    # ------------------------------------------------------------ BAB 12
    d.chapter(12, "Statistik dan Pelaporan", "Dasbor statistik program untuk Manager, Direksi, dan Admin: indikator kinerja, klasemen pelapor, laporan ditolak, dan ekspor laporan.")
    d.in_chapter(["Dasbor statistik", "Indikator kinerja", "Klasemen pelapor", "Laporan ditolak", "Mengunduh laporan"])
    d.section("Dasbor statistik")
    d.p(f"Menu {ui('Statistik')} menyajikan kondisi aktual program. Pilih periode per bulan, per tahun, atau rentang tanggal, dan saring menurut area. Seluruh angka dihitung langsung dari basis data saat halaman dibuka.")
    d.figure("statistik-desk", "Dasbor statistik dengan indikator utama")
    d.p("Dasbor memuat kartu indikator, tren 12 bulan, sebaran tingkat risiko, peta panas area dan jenis bahaya, umur tindak lanjut terbuka, penutupan tepat waktu per area, jenis bahaya, status laporan, hierarki pengendalian, sumber bahaya, laporan ditolak, klasemen pelapor, kinerja per area, partisipasi per peran, dan daftar risiko tinggi yang masih terbuka.")
    d.section("Indikator kinerja")
    d.table("Indikator kinerja program", ["Indikator", "Rumus", "Dasar keputusan"], [
        ["Partisipasi pelapor", "Pengguna yang melapor dibagi pengguna aktif, dikali 100%", "Arah sosialisasi dan penguatan budaya melapor"],
        ["Waktu respons verifikasi", "Rerata jam dari laporan dikirim hingga diverifikasi", "Beban kerja dan kecepatan Superintendent"],
        ["Waktu penutupan", "Rerata hari dari persetujuan hingga verifikasi penutupan", "Kecukupan sumber daya perbaikan"],
        ["Penutupan tepat waktu", "Tindak lanjut selesai sesuai target dibagi seluruh tindak lanjut", "Akuntabilitas penanggung jawab"],
        ["Risiko tinggi terbuka", "Jumlah tindak lanjut risiko Tinggi dan Ekstrem yang belum tuntas", "Prioritas eskalasi dan anggaran"],
        ["Laporan berulang", "Laporan dengan lokasi dan jenis bahaya sama dibagi seluruh laporan", "Efektivitas pengendalian, akar masalah belum tertangani"],
    ], widths=["24%", "42%", "34%"])
    d.p("Indikator ini mendukung pemantauan dan pengukuran kinerja K3 pada klausul 9.1 SNI ISO 45001:2018 dan elemen pemantauan dan evaluasi PP 50/2012.")
    d.section("Klasemen pelapor")
    d.p("Klasemen memuat seluruh pelapor dalam periode, diurutkan dari jumlah laporan, lalu laporan valid dan poin. Tiga teratas diberi lencana emas, perak, dan perunggu. Sepuluh teratas tampil lebih dahulu dan seluruh nama dapat dibuka.")
    d.figure("klasemen", "Klasemen pelapor")
    d.note("catatan", "Sesuai prinsip tidak mencari kesalahan, statistik menampilkan pelapor yang aktif dan tingkat partisipasi, bukan daftar nama yang belum melapor.")
    d.section("Laporan ditolak")
    d.p("Laporan ditolak dihitung menurut tahap (verifikasi atau keputusan Manager) dan alasan, lengkap dengan nomor laporan, area, dan pihak yang menolak. Data ini membantu menelaah konsistensi keputusan penolakan.")
    d.figure("ditolak", "Kartu laporan ditolak pada statistik", width="66%")
    d.section("Mengunduh laporan")
    d.table("Pilihan ekspor statistik", ["Tombol", "Isi berkas", "Kegunaan"], [
        [ui("PDF"), "Ringkasan indikator, grafik, peta panas, sumber bahaya, laporan ditolak, klasemen, kamus indikator", "Lampiran rapat dan laporan berkala"],
        [ui("PowerPoint"), "Sampul, indikator, grafik, klasemen enam teratas, laporan ditolak, kamus indikator", "Paparan kepada pimpinan"],
        [ui("CSV"), "Seluruh tabel data termasuk klasemen lengkap", "Olah data lanjutan di spreadsheet"],
        [ui("Cetak"), "Tampilan dasbor siap cetak", "Arsip cetak"],
    ], widths=["16%", "52%", "32%"])
    d.end_chapter()

    # ------------------------------------------------------------ BAB 13
    d.chapter(13, "Administrasi Program", "Pengelolaan akun, area kerja, akuntabilitas, katalog reward, penukaran, pengaturan alur dan notifikasi, jejak audit, serta pembersihan data uji coba.")
    d.in_chapter(["Pengguna dan peran", "Menghapus akun", "Area kerja dan peta", "Matriks akuntabilitas", "Katalog reward", "Penukaran poin", "Pengaturan alur dan notifikasi", "Jejak audit", "Data uji coba"])
    d.section("Pengguna dan peran")
    d.figure("pengguna-desk", "Halaman Pengguna dan peran")
    d.procedure("Mengaktifkan akun baru", [f"Buka {ui('Pengguna')} dan cari akun berstatus Menunggu persetujuan.", "Tetapkan peran, area kerja, jabatan, departemen, dan atasan. Pengawas beratasan Superintendent, Superintendent beratasan Manager.", f"Ubah status menjadi {ui('Aktif')} dan simpan."], "Pengguna menerima notifikasi aktivasi dan menu tampil sesuai peran.")
    d.note("perhatian", "Atasan menentukan jalur verifikasi. Pengawas tanpa atasan Superintendent yang aktif menyebabkan laporannya tidak memiliki verifikator.")
    d.section("Menghapus akun")
    d.p(f"Setiap baris pada halaman {ui('Pengguna')} memiliki tombol {ui('Hapus')} di bawah {ui('Ubah')}. Penghapusan bersifat permanen dan selalu meminta konfirmasi. Aplikasi menerapkan tiga aturan pengaman.")
    d.table("Aturan penghapusan akun", ["Jenis akun", "Perlakuan"], [
        ["Akun personel dengan riwayat kerja", "Tidak dapat dihapus bila sudah memiliki laporan, keputusan, tindak lanjut, poin, atau konsultasi, karena riwayat tersebut adalah informasi terdokumentasi SMK3. Ubah statusnya menjadi Nonaktif"],
        ["Akun personel tanpa riwayat", "Dapat dihapus, misalnya akun yang salah didaftarkan"],
        ["Akun dummy (contoh)", "Akun berakhiran @demo.peduli.local dapat dihapus beserta laporan, foto, poin, penukaran, dan konsultasi miliknya"],
        ["Akun sendiri dan Admin terakhir", "Tidak dapat dihapus agar program selalu memiliki pengelola"],
    ], widths=["30%", "70%"])
    d.procedure("Menghapus semua akun dummy", [f"Masuk dengan akun Google Admin, bukan akun dummy.", f"Buka {ui('Pengguna')}. Bila masih ada akun dummy, kartu jumlah akun dummy tampil di atas tabel.", f"Tekan {ui('Hapus semua akun dummy')}, baca ringkasannya, lalu tekan tombol konfirmasi."], "Seluruh akun dummy dan datanya terhapus, stok hadiah dari penukaran yang belum ditolak dikembalikan, dan penghapusan tercatat di Jejak audit.")
    d.note("peringatan", "Penghapusan akun tidak dapat dibatalkan. Bawahan dari akun yang dihapus kehilangan atasan; tetapkan atasan baru sesudahnya.")
    d.section("Area kerja dan peta")
    d.p("Area kerja menentukan lokasi laporan, penanggung jawab bawaan, dan pengelompokan statistik. Setiap area memiliki titik pusat dan radius.")
    d.figure("area-desk", "Formulir area kerja dengan peta titik pusat dan lingkaran radius")
    d.procedure("Menetapkan titik area", [f"Buka {ui('Area kerja')} dan tekan {ui('Ubah')} pada area, atau isi formulir {ui('Tambah area')}.", f"Klik peta atau geser penanda ke titik pusat area. Tombol {ui('Lokasi saya')} mengambil titik dari GPS perangkat.", "Sebagai alternatif, tempel tautan Google Maps atau koordinat pada kolom yang tersedia.", "Atur radius sampai lingkaran mencakup area, pilih Manager area, lalu simpan."], "Laporan dari dalam lingkaran otomatis memakai area ini, dan laporan di luar radius ditandai untuk ditinjau.")
    d.section("Matriks akuntabilitas")
    d.p("Matriks akuntabilitas menampilkan alur penugasan temuan per area: siapa verifikator, siapa pengambil keputusan, dan siapa penanggung jawab bawaan, sehingga celah penugasan terlihat sebelum laporan masuk.")
    d.figure("akuntabilitas-desk", "Matriks akuntabilitas")
    d.section("Katalog reward")
    d.figure("reward-desk", "Katalog reward dengan pilihan foto dan ikon")
    d.procedure("Menambah hadiah", [f"Buka {ui('Katalog reward')}.", "Pada kartu Tambah hadiah, isi nama, nilai poin, deskripsi, stok, dan tingkat.", f"Tekan {ui('Unggah foto')} atau pilih salah satu ikon.", f"Tekan {ui('Tambah')}."], "Hadiah tampil pada katalog di halaman Poin dan reward.")
    d.section("Penukaran poin")
    d.p(f"Halaman {ui('Penukaran poin')} memuat pengajuan yang menunggu diproses. Pilih {ui('Diproses')}, {ui('Selesai')}, atau {ui('Ditolak')} dengan catatan. Penolakan mengembalikan poin dan stok secara otomatis.")
    d.figure("penukaran-desk", "Halaman Penukaran poin")
    d.section("Pengaturan alur dan notifikasi")
    d.figure("pengaturan-desk", "Halaman Pengaturan alur")
    d.table("Pengaturan alur", ["Pengaturan", "Fungsi", "Bawaan"], [
        ["Verifikasi Superintendent", "Laporan Pengawas wajib diverifikasi", "Wajib, terkunci"],
        ["Batas waktu verifikasi", "Hari kerja sejak laporan dikirim", "2 hari kerja"],
        ["Eskalasi risiko tinggi", "Manager diberi tahu seketika untuk risiko Tinggi dan Ekstrem", "Aktif"],
        ["Batas waktu keputusan", "Hari kerja sejak laporan terverifikasi", "3 hari kerja"],
        ["Pengingat otomatis", "Dikirim harian bila tahap melewati batas waktu", "Aktif"],
        ["Penanggung jawab per area", "Manager area menjadi usulan penanggung jawab bawaan", "Aktif"],
        ["Tinjauan sesama Manager", "Laporan Manager diputuskan Manager lain", "Aktif"],
        ["Nilai poin dan level", "Poin per laporan, bonus, dan ambang level (khusus Admin)", "Tabel 10.1 dan 10.2"],
        ["Notifikasi ponsel", "Jenis notifikasi yang dikirim ke ponsel", "Seluruh jenis aktif"],
    ], widths=["28%", "50%", "22%"])
    d.figure("pengaturan-notif", "Kartu Notifikasi ponsel pada Pengaturan alur", width="70%")
    d.section("Jejak audit")
    d.p("Jejak audit mencatat masuk dan keluar, keputusan, perubahan pengaturan, pengelolaan akun, katalog, penukaran, konsultasi, dan pembersihan data, lengkap dengan pelaku, waktu, dan rincian perubahan. Catatan ini menjadi informasi terdokumentasi yang dapat ditunjukkan saat audit SMK3.")
    d.figure("audit-desk", "Halaman Jejak audit")
    d.section("Data uji coba")
    d.p(f"Sebelum uji coba lapangan dimulai, data contoh dan data percobaan dibersihkan melalui {path('Pengaturan alur', 'Data uji coba')}. Halaman ini menampilkan jumlah data yang akan dihapus dan meminta konfirmasi.")
    d.figure("datauji-desk", "Halaman Data uji coba")
    d.note("peringatan", "Penghapusan bersifat permanen. Jalankan dengan akun Google admin, bukan akun demo, ketik HAPUS DATA UJI untuk konfirmasi, dan pastikan mode demo telah dimatikan agar data contoh tidak dibuat ulang.")
    d.end_chapter()

    # ------------------------------------------------------------ BAB 14
    d.chapter(14, "Pemecahan Masalah dan Pertanyaan Umum", "Masalah yang paling sering ditemui pengguna beserta penyebab dan cara mengatasinya, serta pertanyaan yang sering diajukan.")
    d.in_chapter(["Tabel pemecahan masalah", "Pertanyaan yang sering diajukan"])
    d.section("Tabel pemecahan masalah")
    d.table("Masalah umum, penyebab, dan cara mengatasi", ["Gejala", "Kemungkinan penyebab", "Cara mengatasi"], [
        ["Tidak dapat masuk", "Alamat surel belum diizinkan", "Hubungi Admin untuk didaftarkan"],
        ["Tertahan di halaman Menunggu persetujuan", "Akun belum diaktifkan Admin", "Hubungi Admin atau atasan langsung"],
        ["Tombol Ambil foto tidak berfungsi", "Izin kamera ditolak", "Izinkan kamera pada pengaturan situs atau aplikasi, lalu muat ulang"],
        ["Lokasi tidak terisi otomatis", "Izin lokasi ditolak atau GPS mati", "Aktifkan GPS dan izin lokasi, lalu tekan tombol perbarui GPS"],
        ["Peringatan di luar radius area", "Lokasi yang dipilih tidak sesuai posisi", "Periksa pilihan Lokasi. Bila benar, laporan tetap dapat dikirim"],
        ["Laporan tersimpan di perangkat", "Tidak ada sinyal saat mengirim", "Tunggu sinyal. Laporan terkirim otomatis"],
        ["Tombol verifikasi atau keputusan tidak tampak", "Laporan pada tahap lain atau di luar wewenang", "Periksa status laporan dan Bab 4.2"],
        ["Notifikasi ponsel tidak muncul", "Notifikasi belum diaktifkan, izin diblokir, atau jenis dimatikan", "Aktifkan di Profil, izinkan notifikasi, periksa pilihan jenis, tekan Kirim uji"],
        ["Notifikasi tidak muncul di iPhone", "PEDULI dibuka dari Safari, bukan dari Layar Utama", "Pasang ke Layar Utama dan buka dari ikonnya"],
        ["Tampilan tidak berubah setelah pembaruan", "Aplikasi masih memakai berkas lama", "Tutup lalu buka kembali aplikasi"],
        ["Muncul halaman Halaman belum berhasil dimuat", "Server sedang sibuk atau koneksi terputus sebentar", "Tekan Coba lagi setelah beberapa detik; data yang sudah tersimpan tetap aman"],
        ["Tombol terasa tidak merespons", "Halaman sedang dimuat (ada garis hijau di tepi atas layar)", "Tunggu garis hijau hilang; mengetuk berulang hanya menambah antrean"],
        ["Tampilan berbahasa Inggris", "Pilihan bahasa ENG aktif", "Tekan IND di pojok kanan atas"],
        ["Berkas ekspor tidak terunduh", "Peramban memblokir unduhan", "Izinkan unduhan, lalu ulangi ekspor"],
    ], widths=["30%", "32%", "38%"])
    d.section("Pertanyaan yang sering diajukan")
    faq = [
        ("Apakah laporan saya akan dipakai untuk menyalahkan seseorang?", "Tidak. Pelaporan bertujuan memperbaiki kondisi kerja. Laporan hanya dibuka oleh pihak yang menindaklanjuti, dan statistik tidak menampilkan daftar nama yang belum melapor."),
        ("Mengapa poin saya belum bertambah?", "Poin diberikan setelah laporan dinyatakan valid oleh Superintendent (jalur A) atau disetujui Manager (jalur B). Laporan ganda atau tidak sesuai fakta tidak memperoleh poin."),
        ("Apakah laporan yang ditolak dihapus?", "Tidak. Laporan ditolak tetap dapat dibuka pada tab Ditolak beserta alasannya dan dihitung pada statistik."),
        ("Dapatkah saya bertanya tanpa diketahui pengurus?", "Dapat. Centang Rahasiakan nama saya dari pengurus saat mengajukan konsultasi. Tim HSE tetap mengetahui penanya untuk keperluan tindak lanjut."),
        ("Apakah lokasi saya dilacak terus-menerus?", "Tidak. Lokasi hanya dibaca saat formulir laporan dibuka dan disimpan bersama laporan."),
        ("Ke mana melaporkan masalah yang tidak tercantum di sini?", "Hubungi Admin program PEDULI (tim HSE) dengan menyebutkan versi aplikasi, langkah yang dilakukan, dan tangkapan layar bila ada."),
    ]
    for i, (q, a) in enumerate(faq):
        d.sub(f"14.2.{i + 1}", q)
        d.p(a)
    d.end_chapter()

    # ------------------------------------------------------------ LAMPIRAN
    d.chapter("A", "Acuan Fitur", "Rujukan cepat setiap fitur PEDULI terhadap regulasi dan standar yang mendasarinya.", kind="LAMPIRAN")
    d.table("Fitur dan acuannya", ["Fitur", "Cara kerja di aplikasi", "Acuan utama"], [
        ["Lapor bahaya", "Foto, lokasi, jenis dan sumber bahaya, uraian, risiko awal", "PP 50/2012; SNI ISO 45001:2018 klausul 6.1.2"],
        ["Verifikasi dan keputusan", "Pemeriksaan berjenjang, pemisahan tugas", "SNI ISO 45001:2018 klausul 5.3 dan 8.1"],
        ["Hierarki pengendalian", "Pilihan pengendalian pada keputusan", "SNI ISO 45001:2018 klausul 8.1.2"],
        ["Tindak lanjut dan penutupan", "Progres, foto bukti, verifikasi hasil", "SNI ISO 45001:2018 klausul 10.2"],
        ["Konsultasi K3", "Pertanyaan pekerja dijawab pengurus", "UU 1/1970; SNI ISO 45001:2018 klausul 5.1 dan 5.4"],
        ["Statistik dan indikator", "Partisipasi, waktu, ketepatan, risiko terbuka", "PP 50/2012 elemen pemantauan; SNI ISO 45001:2018 klausul 9.1"],
        ["Jejak audit", "Pencatatan tindakan penting", "SNI ISO 45001:2018 klausul 7.5"],
        ["Notifikasi ponsel", "Web Push dengan identifikasi VAPID", "RFC 8030; RFC 8292"],
        ["Dua bahasa (IND/ENG)", "Antarmuka, ekspor, dan notifikasi dalam bahasa pilihan pengguna", "SNI ISO 45001:2018 klausul 7.4 (komunikasi)"],
        ["Pengelolaan data", "Lokasi saat laporan, kerahasiaan, akses menurut peran", "UU 27/2022"],
    ], widths=["24%", "40%", "36%"])
    d.end_chapter()
    d.chapter("B", "Glosarium", "Daftar istilah yang dipakai di aplikasi dan manual ini.", kind="LAMPIRAN")
    d.table("Daftar istilah", ["Istilah", "Arti"], [
        ["Bahaya", "Sumber, situasi, atau tindakan yang berpotensi menimbulkan cedera, penyakit, atau kerusakan"],
        ["Eskalasi", "Pemberitahuan langsung kepada Manager atas laporan risiko Tinggi atau Ekstrem"],
        ["Jalur A dan B", "Jalur A melalui verifikasi Superintendent, jalur B langsung kepada Manager"],
        ["Jenis bahaya", "Bentuk bahaya yang ditemukan, misalnya kondisi atau perilaku tidak aman"],
        ["Near miss", "Kejadian yang hampir menimbulkan cedera atau kerusakan"],
        ["Pengurus", "Pimpinan yang memimpin langsung tempat kerja menurut UU 1/1970, di PEDULI ditunjuk dari Direksi atau Manager"],
        ["PIC", "Penanggung jawab perbaikan"],
        ["Risiko awal", "Perkiraan tingkat risiko saat bahaya dilaporkan"],
        ["SMK3", "Sistem Manajemen Keselamatan dan Kesehatan Kerja"],
        ["Sumber bahaya", "Asal bahaya: manusia, peralatan atau mesin, material, metode kerja, lingkungan kerja, kondisi alam"],
        ["Swimlane", "Diagram alir berlajur yang memisahkan kegiatan menurut pelakunya"],
        ["Tim HSE", "Pengelola program PEDULI dengan peran Admin"],
    ], widths=["24%", "76%"])
    d.end_chapter()
    d.chapter("C", "Data dan Privasi", "Ringkasan pengelolaan data pada PEDULI.", kind="LAMPIRAN")
    d.p("PEDULI mengelola data akun pengguna, laporan beserta foto dan koordinat, poin dan penukaran, konsultasi, notifikasi, langganan notifikasi perangkat, dan jejak audit. PT Garuda Yamato Steel berkedudukan sebagai pengendali data, sedangkan Nusa Safety selaku pengembang aplikasi berkedudukan sebagai prosesor data menurut Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.")
    d.ul([
        "Masuk memakai akun Google. Aplikasi tidak menyimpan kata sandi pengguna.",
        "Lokasi GPS hanya dibaca saat formulir laporan dibuka dan disimpan bersama laporan.",
        "Laporan hanya dapat dibaca menurut lingkup peran pada Bab 4.1.",
        "Nama penanya konsultasi dapat dirahasiakan dari pengurus, dan tanya jawab terbuka tidak memuat nama penanya.",
        "Langganan notifikasi perangkat dilepas saat pengguna keluar dan dihapus otomatis bila sudah tidak berlaku.",
        "Berkas ekspor PDF, PowerPoint, dan CSV dibuat di peramban pengguna, tidak disimpan di server.",
        "Permintaan akses, perbaikan, atau penghapusan data pribadi diajukan kepada perusahaan sebagai pengendali data.",
    ])
    d.end_chapter()
    return d


REFS = [
    "Badan Pengembangan dan Pembinaan Bahasa. (2022). <i>Ejaan Bahasa Indonesia yang disempurnakan</i> (Edisi V). Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi.",
    "Badan Standardisasi Nasional. (2018). <i>SNI ISO 45001:2018 Sistem manajemen keselamatan dan kesehatan kerja, Persyaratan dengan panduan penggunaan</i>. BSN.",
    "Bird, F. E., Jr., &amp; Germain, G. L. (1985). <i>Practical loss control leadership</i>. International Loss Control Institute.",
    "Health and Safety Executive. (2013). <i>Managing for health and safety</i> (HSG65, 3rd ed.). HSE Books.",
    "International Organization for Standardization. (1985). <i>ISO 5807:1985 Information processing, Documentation symbols and conventions for data, program and system flowcharts, program network charts and system resources charts</i>. ISO.",
    "International Organization for Standardization. (2018). <i>ISO 45001:2018 Occupational health and safety management systems, Requirements with guidance for use</i>. ISO.",
    "International Organization for Standardization, International Electrotechnical Commission, &amp; Institute of Electrical and Electronics Engineers. (2022). <i>ISO/IEC/IEEE 26514:2022 Systems and software engineering, Design and development of information for users</i>. ISO.",
    "Ishikawa, K. (1985). <i>What is total quality control? The Japanese way</i> (D. J. Lu, Trans.). Prentice-Hall.",
    "Kementerian Ketenagakerjaan Republik Indonesia. (2018). <i>Peraturan Menteri Ketenagakerjaan Nomor 5 Tahun 2018 tentang Keselamatan dan Kesehatan Kerja Lingkungan Kerja</i>.",
    "Reason, J. (1997). <i>Managing the risks of organizational accidents</i>. Ashgate.",
    "Republik Indonesia. (1970). <i>Undang-Undang Nomor 1 Tahun 1970 tentang Keselamatan Kerja</i>.",
    "Republik Indonesia. (2012). <i>Peraturan Pemerintah Nomor 50 Tahun 2012 tentang Penerapan Sistem Manajemen Keselamatan dan Kesehatan Kerja</i>.",
    "Republik Indonesia. (2019). <i>Peraturan Pemerintah Nomor 88 Tahun 2019 tentang Kesehatan Kerja</i>.",
    "Republik Indonesia. (2022). <i>Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi</i>.",
    "Thomson, M., &amp; Beverloo, P. (2017). <i>Voluntary application server identification (VAPID) for web push</i> (RFC 8292). Internet Engineering Task Force. https://doi.org/10.17487/RFC8292",
    "Thomson, M., Damaggio, E., &amp; Raymor, B. (2016). <i>Generic event delivery using HTTP push</i> (RFC 8030). Internet Engineering Task Force. https://doi.org/10.17487/RFC8030",
]
