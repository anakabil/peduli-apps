"""Menyusun presentasi PEDULI Apps di atas template PowerPoint Nusa Safety.

Pemakaian: python3 build_pptx.py <template.pptx> <keluaran.pptx>
Gambar layar diambil dari docs/manual/src/img (hasil docs/manual/src/shoot.mjs + prep_img.py).
"""
import copy
import os
import sys

from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
IMG = os.path.join(REPO, "docs", "manual", "src", "img")
BRAND = os.path.join(REPO, "public", "brand")

BLUE = RGBColor(0x00, 0x0B, 0x9D)
YELLOW = RGBColor(0xFD, 0xC8, 0x30)
SLATE = RGBColor(0x52, 0x5B, 0x88)
INK = RGBColor(0x1B, 0x1B, 0x33)
SOFT = RGBColor(0x4A, 0x4E, 0x6A)
CARD = RGBColor(0xF5, 0xF6, 0xFC)
LINE = RGBColor(0xD9, 0xDC, 0xEF)
BAND = RGBColor(0xEE, 0xF0, 0xFA)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
FONT = "Arial"

src, out = sys.argv[1], sys.argv[2]
prs = Presentation(src)
LAYOUT = next(l for l in prs.slide_masters[0].slide_layouts if l.name == "Title and Content")


# ---------------------------------------------------------------- utilitas
def text(slide, x, y, w, h, runs, size=20, color=INK, bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.15):
    """runs: string atau daftar paragraf; tiap paragraf string atau daftar (teks, {opsi})"""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Inches(0.05)
    tf.margin_top = tf.margin_bottom = Inches(0.03)
    paras = runs if isinstance(runs, list) else [runs]
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        parts = para if isinstance(para, list) else [(para, {})]
        for t, o in parts:
            r = p.add_run()
            r.text = t
            f = r.font
            f.name = FONT
            f.size = Pt(o.get("size", size))
            f.bold = o.get("bold", bold)
            f.color.rgb = o.get("color", color)
    return tb


def rect(slide, x, y, w, h, fill=CARD, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06, weight=1):
    s = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid()
        s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(weight)
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = radius
    s.shadow.inherit = False
    return s


def picture(slide, name, x, y, w, h, folder=IMG):
    """Gambar dimuat utuh di dalam kotak (x, y, w, h), di tengah, dengan bingkai tipis"""
    path = os.path.join(folder, name)
    from PIL import Image
    iw, ih = Image.open(path).size
    scale = min(w / iw, h / ih)
    pw, ph = iw * scale, ih * scale
    px, py = x + (w - pw) / 2, y + (h - ph) / 2
    pic = slide.shapes.add_picture(path, Inches(px), Inches(py), Inches(pw), Inches(ph))
    pic.line.color.rgb = LINE
    pic.line.width = Pt(1)
    return pic


def badge(slide, x, y, n, d=0.52, fill=BLUE, color=WHITE):
    c = rect(slide, x, y, d, d, fill=fill, line=None, shape=MSO_SHAPE.OVAL)
    tf = c.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = str(n)
    r.font.name = FONT
    r.font.size = Pt(22)
    r.font.bold = True
    r.font.color.rgb = color
    return c


def items(slide, x, y, w, rows, gap=0.32, title_size=26, desc_size=21):
    """Daftar bernomor: rows = [(judul, keterangan)]"""
    cy = y
    for i, (t, d) in enumerate(rows):
        badge(slide, x, cy + 0.02, i + 1, d=0.62)
        h = 0.5 + (0.42 * (1 + len(d) // int((w - 0.85) * 5.6)) if d else 0)
        text(slide, x + 0.85, cy, w - 0.85, h, [[(t, {"bold": True, "size": title_size})]] + ([[(d, {"size": desc_size, "color": SOFT})]] if d else []), spacing=1.1)
        cy += h + gap
    return cy


def table(slide, x, y, w, rows, widths, size=16, header_size=16, row_h=0.5):
    shp = slide.shapes.add_table(len(rows), len(rows[0]), Inches(x), Inches(y), Inches(w), Inches(row_h * len(rows)))
    tbl = shp.table
    # Tanpa gaya bawaan tema
    tblPr = tbl._tbl.tblPr
    for k in ("firstRow", "bandRow"):
        tblPr.set(k, "0")
    for i, cw in enumerate(widths):
        tbl.columns[i].width = Inches(w * cw)
    for r, row in enumerate(rows):
        tbl.rows[r].height = Inches(row_h)
        for c, val in enumerate(row):
            cell = tbl.cell(r, c)
            cell.margin_left = cell.margin_right = Inches(0.12)
            cell.margin_top = cell.margin_bottom = Inches(0.05)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.fill.solid()
            cell.fill.fore_color.rgb = BLUE if r == 0 else (BAND if r % 2 == 0 else WHITE)
            tf = cell.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = ""
            run = p.add_run()
            run.text = val
            run.font.name = FONT
            run.font.size = Pt(header_size if r == 0 else size)
            run.font.bold = r == 0
            run.font.color.rgb = WHITE if r == 0 else INK
    return shp


def new_slide(title, lead=None, notes=None):
    s = prs.slides.add_slide(LAYOUT)
    for ph in list(s.placeholders):
        ph._element.getparent().remove(ph._element)
    text(s, 2.6, 0.78, 14.8, 0.8, title, size=34, color=BLUE, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    if lead:
        text(s, 2.6, 1.62, 14.8, 0.5, lead, size=18, color=SLATE, align=PP_ALIGN.CENTER)
    bar = rect(s, 9.4, 1.6 if not lead else 2.16, 1.2, 0.07, fill=YELLOW, line=None, shape=MSO_SHAPE.RECTANGLE)
    if notes:
        s.notes_slide.notes_text_frame.text = notes
    return s


def card(slide, x, y, w, h, tag, head, body, tag_color=SLATE):
    rect(slide, x, y, w, h)
    rect(slide, x, y, w, 0.12, fill=YELLOW, line=None, shape=MSO_SHAPE.RECTANGLE)
    text(slide, x + 0.4, y + 0.42, w - 0.8, 0.45, tag, size=18, bold=True, color=tag_color)
    text(slide, x + 0.4, y + 0.95, w - 0.8, 1.2, head, size=28, bold=True, color=INK, spacing=1.1)
    text(slide, x + 0.4, y + 2.25, w - 0.8, h - 2.45, body, size=22, color=SOFT, spacing=1.25)


def note(slide, x, y, w, h, body, size=21):
    rect(slide, x, y, w, h, fill=CARD, line=LINE)
    rect(slide, x, y, 0.1, h, fill=YELLOW, line=None, shape=MSO_SHAPE.RECTANGLE)
    text(slide, x + 0.35, y, w - 0.55, h, body, size=size, color=SOFT, anchor=MSO_ANCHOR.MIDDLE, spacing=1.2)


def steps(slide, y, data, h=2.6):
    n = len(data)
    gap, arrow = 0.16, 0.42
    x0, total = 1.6, 16.8
    w = (total - (n - 1) * (gap * 2 + arrow)) / n
    x = x0
    for i, (who, t, d) in enumerate(data):
        rect(slide, x, y, w, h)
        rect(slide, x, y, w, 0.12, fill=BLUE, line=None, shape=MSO_SHAPE.RECTANGLE)
        text(slide, x + 0.25, y + 0.38, w - 0.5, 0.45, who, size=15, bold=True, color=SLATE)
        text(slide, x + 0.25, y + 0.88, w - 0.5, 0.6, t, size=30, bold=True, color=INK)
        text(slide, x + 0.25, y + 1.62, w - 0.5, h - 1.75, d, size=19, color=SOFT, spacing=1.2)
        if i < n - 1:
            a = rect(slide, x + w + gap, y + h / 2 - 0.2, arrow, 0.4, fill=YELLOW, line=None, shape=MSO_SHAPE.RIGHT_ARROW)
        x += w + gap * 2 + arrow


# ---------------------------------------------------------------- sampul (slide 1 template)
cover = prs.slides[0]
for sh in cover.shapes:
    if not sh.has_text_frame:
        continue
    t = sh.text_frame.text
    if t.startswith("Pekerjaan Konsultansi"):
        runs = sh.text_frame.paragraphs[0].runs
        runs[0].text = "Sosialisasi Aplikasi K3 PT Garuda Yamato Steel"
        for r in runs[1:]:
            r.text = ""
        sh.width = Inches(12)
    elif t.startswith("Safety Culture"):
        p = sh.text_frame.paragraphs[0]
        runs = p.runs
        runs[0].text = "PEDULI Apps: Pelaporan Bahaya dan Upaya Pengendalian"
        for r in runs[1:]:
            r.text = ""
        sh.width = Inches(10.5)
        sh.height = Inches(1.6)
        sh.text_frame.word_wrap = True
# logo GYS dan PEDULI di bawah judul
box = rect(cover, 1.17, 6.05, 4.9, 1.15, fill=WHITE, line=LINE, radius=0.12)
cover.shapes.add_picture(os.path.join(BRAND, "gys-logo.png"), Inches(1.45), Inches(6.17), Inches(0.9), Inches(0.9))
cover.shapes.add_picture(os.path.join(BRAND, "peduli-logo-compact.png"), Inches(2.6), Inches(6.2), Inches(3.2), Inches(1.03))
cover.notes_slide.notes_text_frame.text = "Pembuka. PEDULI adalah singkatan dari Pelaporan Bahaya dan Upaya Pengendalian, aplikasi pelaporan bahaya untuk PT Garuda Yamato Steel yang dikembangkan Nusa Safety."

# ---------------------------------------------------------------- isi
s = new_slide("PEDULI menjawab tiga kebutuhan program K3", notes="Tiga kata kunci: catat, kawal, ukur. Setiap temuan punya bukti, setiap laporan punya penanggung jawab dan batas waktu, dan pimpinan melihat kinerja K3 kapan saja.")
cw = (16.8 - 2 * 0.5) / 3
for i, (tag, head, body) in enumerate([
    ("CATAT", "Setiap temuan terdokumentasi", "Bahaya dilaporkan dari ponsel di lokasi: foto dari kamera, titik GPS, waktu, jenis dan sumber bahaya, serta tingkat risiko awal."),
    ("KAWAL", "Setiap laporan punya penanggung jawab", "Laporan diverifikasi, diputuskan dengan hierarki pengendalian, ditugaskan ke PIC dengan target, lalu ditutup setelah hasilnya diperiksa."),
    ("UKUR", "Pimpinan melihat kinerja K3", "Statistik, klasemen pelapor, dan risiko tinggi yang masih terbuka tersedia langsung, siap diekspor ke PDF dan PowerPoint."),
]):
    card(s, 1.6 + i * (cw + 0.5), 2.6, cw, 6.2, tag, head, body)

s = new_slide("Dibuka dari peramban, dipasang seperti aplikasi", notes="Tidak perlu Play Store atau App Store. Pekerja membuka alamat aplikasi, masuk dengan akun Google, lalu memasangnya ke layar utama. Laporan tetap bisa dibuat tanpa sinyal.")
items(s, 1.6, 2.5, 6.4, [
    ("Tanpa toko aplikasi", "Aplikasi web progresif (PWA), dipasang ke layar utama Android dan iPhone."),
    ("Ponsel dan komputer", "Lapor di lapangan lewat ponsel, kelola dan pantau dari komputer."),
    ("Tetap jalan tanpa sinyal", "Laporan tersimpan di perangkat, terkirim otomatis saat jaringan kembali."),
    ("Indonesia dan Inggris", "Tombol IND/ENG untuk personel asing di perusahaan PMA."),
])
picture(s, "m-tiga.jpg", 8.4, 2.4, 10.0, 7.6)

s = new_slide("Lima tahap, setiap tahap punya pemilik dan batas waktu", notes="Laporan Pengawas diverifikasi Superintendent lalu diputuskan Manager. Batas waktu bawaan dua hari kerja untuk verifikasi dan tiga hari kerja untuk keputusan. Laporan risiko tinggi langsung diberitahukan ke Manager area.")
steps(s, 2.7, [
    ("PELAPOR", "Lapor", "Foto, lokasi, jenis dan sumber bahaya, risiko awal"),
    ("SUPERINTENDENT", "Verifikasi", "Valid, revisi, atau tolak dalam 2 hari kerja"),
    ("MANAGER", "Keputusan", "Hierarki pengendalian, PIC, dan target dalam 3 hari kerja"),
    ("PIC", "Perbaikan", "Progres dan foto bukti sampai target"),
    ("MANAGER", "Penutupan", "Hasil diperiksa di lapangan, laporan ditutup"),
], h=3.9)
note(s, 1.6, 7.0, 16.8, 1.5, "Laporan dari Superintendent, Manager, dan Direksi langsung ke tahap keputusan. Laporan risiko Tinggi dan Ekstrem langsung diberitahukan ke Manager area, dan pengingat otomatis dikirim setiap hari untuk tahap yang melewati batas waktu.")

s = new_slide("Formulir lima bagian, selesai dalam beberapa menit", notes="Foto wajib dari kamera, lokasi terisi dari GPS. Jenis bahaya menjawab bentuknya, sumber bahaya menjawab asalnya (5M). Setelah dikirim, laporan bernomor PDL-tahunbulan-urutan dan atasan langsung menerima notifikasi.")
picture(s, "m-lapor.jpg", 1.6, 2.4, 9.6, 7.6)
items(s, 11.7, 2.4, 6.7, [
    ("Foto dan lokasi", "Maksimal 3 foto dari kamera, area terisi dari GPS"),
    ("Jenis dan sumber bahaya", "Kondisi, perilaku, near miss; manusia, mesin, material, metode, lingkungan"),
    ("Uraian dan risiko awal", "Rendah, Sedang, Tinggi, atau Ekstrem"),
    ("Usulan perbaikan", "Tindakan cepat, pencegahan, dan usulan PIC"),
    ("Keterangan", "Bukan untuk menyalahkan, dijaga kerahasiaannya"),
], gap=0.12)

s = new_slide("Diperiksa berjenjang, dikendalikan menurut hierarki", notes="Laporan yang ditolak tidak dihapus, tetap tercatat dengan alasannya. Pada keputusan, Manager memilih pengendalian dari eliminasi sampai APD sesuai hierarki pengendalian ISO 45001 klausul 8.1.2.")
picture(s, "panel-verifikasi.jpg", 1.6, 2.4, 6.6, 7.6)
text(s, 8.8, 2.45, 9.6, 1.2, "Superintendent memeriksa foto, lokasi, dan uraian. Manager memilih pengendalian yang paling efektif, menetapkan PIC, sumber daya, dan target.", size=22, color=SOFT, spacing=1.2)
table(s, 8.8, 4.0, 9.6, [
    ["No", "Pengendalian", "Contoh"],
    ["1", "Eliminasi", "Menghilangkan sumber bahaya"],
    ["2", "Substitusi", "Bahan atau cara yang lebih aman"],
    ["3", "Rekayasa teknik", "Pelindung mesin, pembatas"],
    ["4", "Administratif", "Prosedur, rambu, izin kerja"],
    ["5", "APD", "Lapis perlindungan terakhir"],
], [0.1, 0.33, 0.57], size=21, header_size=21, row_h=0.72)
text(s, 8.8, 8.55, 9.6, 0.45, "Acuan: SNI ISO 45001:2018 klausul 8.1.2", size=18, color=SLATE)

s = new_slide("Perbaikan terpantau sampai ditutup", notes="Penanggung jawab melihat tugasnya di menu Tindak lanjut. Notifikasi muncul di ponsel meskipun aplikasi tertutup, dan setiap orang memilih jenis notifikasi yang diterima. Penutupan tepat waktu dihitung di statistik.")
picture(s, "panel-progres.jpg", 1.6, 2.4, 5.6, 7.4)
picture(s, "m-profil-notif.jpg", 7.5, 2.4, 3.7, 7.4)
items(s, 11.7, 2.5, 6.7, [
    ("Progres dan bukti", "PIC menggeser progres, menulis catatan, dan memotret hasil"),
    ("Hasil diperiksa", "Diterima dan ditutup, atau dikembalikan dengan catatan"),
    ("Notifikasi ponsel", "10 jenis yang dapat dipilih tiap pengguna"),
    ("Pengingat harian", "Otomatis untuk tahap yang lewat batas waktu"),
])

s = new_slide("Lima peran, pemisahan tugas dijaga aplikasi", notes="Setiap akun punya satu peran yang ditetapkan Admin. Hak akses diperiksa di server. Tidak ada satu orang yang melapor, menyetujui, sekaligus menilai pekerjaannya sendiri.")
table(s, 1.6, 2.4, 16.8, [
    ["Peran", "Lingkup data", "Wewenang utama"],
    ["Pengawas", "Laporan sendiri dan yang ditanganinya", "Melapor, memperbarui progres bila menjadi PIC, menukar poin"],
    ["Superintendent", "Laporan bawahan dan areanya", "Memverifikasi laporan Pengawas dan hasil perbaikan"],
    ["Manager", "Seluruh laporan", "Memutuskan, menetapkan PIC dan target, menutup, menjawab konsultasi"],
    ["Direksi", "Seluruh laporan dan statistik", "Membaca kinerja program, menjawab konsultasi sebagai pengurus"],
    ["Admin (tim HSE)", "Seluruh data", "Akun, area, reward, pengaturan alur, penyaringan konsultasi, jejak audit"],
], [0.18, 0.3, 0.52], size=22, header_size=22, row_h=0.9)
note(s, 1.6, 8.15, 16.8, 1.4, "Laporan Pengawas wajib diverifikasi sebelum diputuskan, Manager tidak memutuskan laporannya sendiri, dan setiap keputusan serta perubahan pengaturan tercatat di jejak audit.")

s = new_slide("Menghargai laporan yang berkualitas, bukan jumlahnya", notes="Poin baru diberikan setelah laporan valid. Near miss bernilai lebih tinggi sebagai peringatan dini sebelum cedera. Poin ditukar hadiah dari katalog yang dikelola tim HSE.")
table(s, 1.6, 2.5, 7.6, [
    ["Jenis poin", "Nilai"],
    ["Laporan bahaya valid", "2"],
    ["Laporan near miss valid", "3"],
    ["Bonus risiko Tinggi atau Ekstrem", "+3"],
    ["Bonus usulan diterapkan", "+3"],
    ["Bonus konsisten 4 minggu", "+5"],
], [0.78, 0.22], size=22, header_size=22, row_h=0.78)
text(s, 1.6, 7.4, 7.6, 1.2, "Level Perunggu, Perak (50 poin), dan Emas (150 poin). Nilai dapat diatur Admin.", size=21, color=SOFT, spacing=1.2)
picture(s, "poin-desk.jpg", 9.7, 2.4, 8.7, 7.4)

s = new_slide("Pertanyaan pekerja dijawab langsung oleh pengurus", notes="Wujud kepemimpinan dan komitmen pengurus sesuai ISO 45001 klausul 5.1, sekaligus konsultasi dan partisipasi pekerja klausul 5.4. Tim HSE menyaring sebelum pertanyaan sampai ke pengurus.")
items(s, 1.6, 2.5, 6.6, [
    ("Pekerja bertanya", "Dari Beranda, nama boleh dirahasiakan dari pengurus"),
    ("Tim HSE menyaring", "Meneruskan ke Direksi atau Manager, atau memberi arahan"),
    ("Pengurus menjawab", "Jawaban terpilih tampil di Tanya jawab tanpa nama penanya"),
])
text(s, 1.6, 8.3, 6.6, 1.0, "Dasar: UU 1/1970; SNI ISO 45001:2018 klausul 5.1 dan 5.4", size=19, color=SLATE)
picture(s, "konsultasi-jawab.jpg", 8.7, 2.4, 9.7, 7.4)

s = new_slide("Enam indikator kinerja, dihitung langsung dari data", notes="Dasbor tersedia untuk Manager, Direksi, dan Admin dengan filter periode dan area. Indikator mendukung klausul 9.1 ISO 45001 dan elemen pemantauan PP 50/2012.")
picture(s, "statistik-desk.jpg", 1.6, 2.4, 10.2, 7.4)
y = items(s, 12.2, 2.5, 6.2, [
    ("Partisipasi pelapor", ""), ("Waktu respons verifikasi", ""), ("Waktu penutupan", ""),
    ("Penutupan tepat waktu", ""), ("Risiko tinggi terbuka", ""), ("Laporan berulang", ""),
], gap=0.36)
text(s, 12.2, y + 0.1, 6.2, 1.2, "Ditambah klasemen pelapor dan laporan ditolak. Ekspor PDF, PowerPoint, CSV.", size=20, color=SOFT, spacing=1.2)

s = new_slide("Siap dipakai personel lokal dan asing", notes="Dengan satu ketukan pada ENG, antarmuka berbahasa Inggris dan notifikasi dikirim dalam bahasa pilihan penerima. Aplikasi tidak menyimpan kata sandi, akses diperiksa menurut peran, dan tindakan penting tercatat di jejak audit.")
picture(s, "beranda-en-desk.jpg", 1.6, 2.4, 9.8, 7.4)
items(s, 11.9, 2.5, 6.5, [
    ("IND / ENG di pojok kanan atas", "Menu, ekspor, dan notifikasi ikut bahasa penerima"),
    ("Masuk dengan akun Google", "Akun baru menunggu aktivasi Admin"),
    ("Hak akses diperiksa di server", "Setiap halaman dan aksi sesuai peran"),
    ("Privasi data pribadi", "GPS hanya saat melapor, mengacu UU 27/2022"),
])

s = new_slide("Setiap fitur berpijak pada regulasi dan standar", notes="PEDULI adalah sarana menjalankan elemen SMK3: identifikasi bahaya, pengendalian, informasi terdokumentasi, pemantauan, dan tinjauan manajemen.")
table(s, 1.6, 2.5, 16.8, [
    ["Acuan", "Diterapkan pada"],
    ["UU Nomor 1 Tahun 1970", "Kewajiban pengurus; layanan konsultasi K3"],
    ["PP Nomor 50 Tahun 2012 (SMK3)", "Identifikasi bahaya, pengendalian, pemantauan dan evaluasi"],
    ["SNI ISO 45001:2018 klausul 5.1 dan 5.4", "Kepemimpinan, konsultasi dan partisipasi pekerja"],
    ["SNI ISO 45001:2018 klausul 6.1.2 dan 8.1.2", "Lapor bahaya, hierarki pengendalian pada keputusan"],
    ["SNI ISO 45001:2018 klausul 7.5 dan 9.1", "Jejak audit, statistik dan indikator kinerja"],
    ["UU Nomor 27 Tahun 2022", "Pelindungan data pribadi pengguna"],
], [0.42, 0.58], size=22, header_size=22, row_h=0.95)

s = new_slide("TypeScript di atas Node.js, data di PostgreSQL", notes="Untuk tim IT: kode ditulis dalam TypeScript, basis data PostgreSQL sesuai standar GYS. Uji coba berjalan di cloud; aplikasi dapat dipasang di server GYS. Rinciannya ada di dokumen Spesifikasi Teknis.")
table(s, 1.6, 2.5, 9.6, [
    ["Lapisan", "Teknologi"],
    ["Aplikasi", "Next.js 15, React 19, TypeScript"],
    ["Server", "Node.js 20 atau lebih baru"],
    ["Basis data", "PostgreSQL 14+, Prisma ORM"],
    ["Login", "Auth.js, Google OAuth"],
    ["Notifikasi", "Web Push (VAPID)"],
    ["Pengujian", "Playwright, 46 skenario ujung ke ujung"],
], [0.32, 0.68], size=21, header_size=21, row_h=0.85)
card(s, 11.8, 2.5, 6.6, 3.2, "SAAT INI", "Cloud untuk uji coba", "Vercel wilayah Singapura dan Prisma Postgres.")
card(s, 11.8, 5.95, 6.6, 3.7, "PILIHAN", "Server GYS", "Satu layanan Node.js atau Docker di belakang Nginx atau Apache, tersambung ke PostgreSQL GYS.")

s = new_slide("Lima langkah menuju penerapan penuh", notes="Langkah pertama memakai templat data go-live. Data contoh dibersihkan sebelum uji coba. Statistik menjadi dasar evaluasi. Untuk go-live seluruh area, paket basis data dan hosting perlu dinaikkan. Isi tanggal dan area sesuai kesepakatan dengan GYS.")
steps(s, 2.7, [
    ("LANGKAH 1", "Data awal", "Akun, peran, atasan, area kerja, katalog reward"),
    ("LANGKAH 2", "Sosialisasi", "Pelatihan per peran dengan Manual Pengguna"),
    ("LANGKAH 3", "Uji coba", "Area percontohan, data uji dibersihkan sebelumnya"),
    ("LANGKAH 4", "Evaluasi", "Tinjau indikator statistik dan masukan pengguna"),
    ("LANGKAH 5", "Go-live", "Seluruh area, kapasitas server disesuaikan"),
], h=3.9)
note(s, 1.6, 7.0, 16.8, 1.5, "Jadwal: [tanggal mulai uji coba] sampai [tanggal go-live]. Area percontohan: [nama area]. Penanggung jawab program: tim HSE GYS bersama Nusa Safety.")

# ---------------------------------------------------------------- susunan: sampul, isi, penutup; contoh template dibuang
sldIdLst = prs.slides._sldIdLst
ids = list(sldIdLst)
cover_id, sample1, sample2, closing_id = ids[0], ids[1], ids[2], ids[3]
for sid in (sample1, sample2):
    rId = sid.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    prs.part.drop_rel(rId)
    sldIdLst.remove(sid)
sldIdLst.remove(closing_id)
sldIdLst.append(closing_id)
prs.slides[len(prs.slides) - 1].notes_slide.notes_text_frame.text = "Penutup: Lihat bahaya, laporkan, kendalikan bersama. Buka sesi tanya jawab."

prs.save(out)
print("slides", len(prs.slides), "->", out)
