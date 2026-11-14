"""Menyusun HTML manual. Pemakaian: python3 build.py [pages.json]"""
import json, os, sys
from html import escape as E
import content as C

D = os.path.dirname(os.path.abspath(__file__))
REPO = "/home/user/peduli-apps"
pages = json.load(open(sys.argv[1])) if len(sys.argv) > 1 and os.path.exists(sys.argv[1]) else {}


def pg(key):
    return str(pages.get(key, "00"))


CSS = r"""
@page { size: A4; }
:root { --g9:#064a38; --g7:#0a785b; --g5:#2e9a78; --g1:#e7f3ee; --g0:#f3f9f6; --ink:#1b2420; --mut:#5b6b64; --line:#d5e2dc; --gold:#a77f00; }
* { box-sizing: border-box; }
html, body { margin:0; padding:0; }
body { font-family: Inter, sans-serif; color: var(--ink); font-size: 9.6pt; line-height: 1.55; font-feature-settings: "cv11", "ss01"; }
p { margin: 0 0 7pt; text-align: justify; hyphens: auto; }
b { font-weight: 650; }
.mk { font-size: 1pt; color: #fff; letter-spacing: 0; }
.eyebrow { font-size: 8pt; font-weight: 700; letter-spacing: .14em; color: var(--g7); }
.eyebrow.small { font-size: 7pt; }
.page-break { break-after: page; }

/* bagian depan */
.front h1 { font-size: 20pt; color: var(--g9); margin: 0 0 4pt; letter-spacing: -.01em; }
.front .rule { height: 3pt; width: 46pt; background: var(--g7); border-radius: 2pt; margin: 6pt 0 14pt; }
.legal h3 { font-size: 9.2pt; color: var(--g9); margin: 12pt 0 3pt; }
.legal p { font-size: 8.8pt; color: #33413b; }
.kv { width: 100%; border-collapse: collapse; margin: 4pt 0 14pt; font-size: 8.8pt; }
.kv td { border-bottom: 1px solid var(--line); padding: 4.5pt 6pt; vertical-align: top; }
.kv td:first-child { width: 32%; color: var(--mut); font-weight: 600; }
.sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10pt; margin-top: 6pt; }
.sign > div { border: 1px solid var(--line); border-radius: 6pt; padding: 8pt 9pt; font-size: 8.4pt; min-height: 92pt; display:flex; flex-direction:column; }
.sign .r { font-size: 7pt; font-weight: 700; letter-spacing: .12em; color: var(--g7); }
.sign .sp { flex: 1; }
.sign .n { border-top: 1px solid var(--line); padding-top: 4pt; color: var(--mut); }

/* daftar isi */
.toc { list-style: none; padding: 0; margin: 0; }
.toc li { display: flex; align-items: baseline; gap: 6pt; padding: 2.2pt 0; font-size: 9.2pt; }
.toc li .t { flex: none; max-width: 85%; }
.toc li .dots { flex: 1; border-bottom: 1px dotted #a9bbb3; transform: translateY(-3pt); }
.toc li .p { flex: none; font-variant-numeric: tabular-nums; color: var(--mut); min-width: 16pt; text-align: right; }
.toc li.l0 { margin-top: 7pt; font-weight: 700; color: var(--g9); font-size: 9.8pt; }
.toc li.l0 .num { display:inline-block; min-width: 54pt; color: var(--g7); font-size: 7.6pt; letter-spacing: .12em; }
.toc li.l1 { padding-left: 54pt; }
.toc li.l1 .num { display:inline-block; min-width: 28pt; color: var(--mut); }
.lists h2 { font-size: 11pt; color: var(--g9); margin: 14pt 0 4pt; }

/* bab */
.chapter { break-before: page; }
.ch-head { position: relative; padding: 4pt 0 10pt; margin-bottom: 10pt; border-bottom: 2pt solid var(--g7); }
.ch-big { position: absolute; right: 0; top: -14pt; font-size: 74pt; font-weight: 800; color: var(--g1); line-height: 1; letter-spacing: -.04em; z-index: -1; }
.ch-head h1 { font-size: 23pt; margin: 2pt 0 5pt; color: var(--g9); letter-spacing: -.015em; line-height: 1.15; }
.lead { font-size: 10.4pt; color: #3d4c46; max-width: 82%; margin: 0; text-align: left; }
.inbox { background: var(--g0); border: 1px solid var(--line); border-left: 3pt solid var(--g7); border-radius: 4pt; padding: 8pt 12pt; margin: 0 0 14pt; break-inside: avoid; }
.inbox ul { margin: 4pt 0 0; padding: 0; list-style: none; columns: 2; column-gap: 18pt; }
.inbox li { font-size: 8.8pt; padding: 1.4pt 0; break-inside: avoid; }
.inbox li b { color: var(--g7); display: inline-block; min-width: 24pt; }
h2 { font-size: 13pt; color: var(--g9); margin: 16pt 0 6pt; break-after: avoid; letter-spacing: -.005em; }
h2 .num { color: var(--g7); margin-right: 4pt; }
h3 { font-size: 10.2pt; color: var(--g9); margin: 11pt 0 3pt; break-after: avoid; }
h3 .num { color: var(--g7); margin-right: 3pt; font-weight: 600; }
ul, ol { margin: 0 0 8pt; padding-left: 16pt; }
li { margin: 1.5pt 0; }
.ui { font-weight: 650; color: var(--g9); }
.chev { color: var(--g7); font-weight: 700; }

/* tabel */
.keep { break-inside: avoid; }
.tcap { font-size: 8.4pt; color: var(--mut); margin: 10pt 0 3pt; break-after: avoid; }
.tcap b { color: var(--g9); margin-right: 3pt; }
table.t { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 8.5pt; line-height: 1.42; margin: 0 0 10pt; border: 1px solid var(--line); border-radius: 5pt; overflow: hidden; }
table.t th { background: var(--g9); color: #fff; text-align: left; font-weight: 650; padding: 5pt 6pt; font-size: 8.2pt; }
table.t td { padding: 4.4pt 6pt; border-top: 1px solid var(--line); vertical-align: top; }
table.t tbody tr:nth-child(even) td { background: var(--g0); }
table.t td.b { font-weight: 650; color: var(--g9); }
table.t tr { break-inside: avoid; }
table.t thead { display: table-header-group; }
table.matrix td:not(:first-child), table.matrix th:not(:first-child) { text-align: center; }
table.matrix td:not(:first-child) { color: var(--g7); font-weight: 650; font-size: 8pt; }
table.small { font-size: 7.8pt; }
table.small th { font-size: 7.6pt; }
table.sym td { vertical-align: middle; }
.pill { display: inline-block; padding: 1pt 7pt; border-radius: 9pt; font-weight: 700; font-size: 7.8pt; }
.pill.g { background: #e3f4ea; color: #1d7a45; } .pill.y { background: #fdf3d3; color: #8a6500; }
.pill.o { background: #fde6d6; color: #b24c0b; } .pill.r { background: #fbdcdc; color: #b21f1f; }

/* gambar */
figure { margin: 8pt 0 12pt; text-align: center; break-inside: avoid; }
figure img { max-width: 100%; max-height: 150mm; object-fit: contain; border-radius: 4pt; }
figcaption { font-size: 8.4pt; color: var(--mut); margin-top: 4pt; }
figcaption b { color: var(--g9); margin-right: 3pt; }
figure.diag svg { max-height: 205mm; }

/* prosedur */
.proc { border: 1px solid var(--line); border-radius: 6pt; margin: 8pt 0 12pt; break-inside: avoid; overflow: hidden; }
.proc .ph { background: var(--g1); padding: 5pt 10pt; border-bottom: 1px solid var(--line); font-size: 9.2pt; color: var(--g9); }
.proc .ph .eyebrow { margin-right: 5pt; }
.proc ol { list-style: none; padding: 6pt 10pt 2pt; margin: 0; }
.proc li { display: flex; gap: 8pt; margin: 0 0 5pt; align-items: flex-start; }
.proc li .n { flex: none; width: 15pt; height: 15pt; border-radius: 50%; background: var(--g7); color: #fff; font-weight: 700; font-size: 7.8pt; display: grid; place-items: center; margin-top: .5pt; }
.proc .res { background: var(--g0); border-top: 1px dashed var(--line); padding: 5pt 10pt; font-size: 8.8pt; }
.proc .res b { color: var(--g7); }

/* catatan */
.note { display: flex; gap: 8pt; padding: 7pt 10pt; border-radius: 5pt; margin: 6pt 0 10pt; font-size: 8.8pt; break-inside: avoid; border: 1px solid; }
.note svg { flex: none; width: 15pt; height: 15pt; margin-top: 1pt; }
.note .nt { font-size: 7pt; font-weight: 800; letter-spacing: .14em; margin-bottom: 1pt; }
.note.catatan { background: #eef5fb; border-color: #cfe0ef; color: #1f3a52; } .note.catatan svg, .note.catatan .nt { color: #2a6aa3; }
.note.tips { background: var(--g0); border-color: #cfe5da; } .note.tips svg, .note.tips .nt { color: var(--g7); }
.note.perhatian { background: #fff8e6; border-color: #f1e0b0; } .note.perhatian svg, .note.perhatian .nt { color: #a77f00; }
.note.peringatan { background: #fdeeee; border-color: #f2cccc; } .note.peringatan svg, .note.peringatan .nt { color: #b42323; }

/* PDCA */
.pdca { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7pt; margin: 6pt 0 12pt; break-inside: avoid; }
.pdca > div { border-radius: 6pt; padding: 8pt 9pt; font-size: 8.4pt; border: 1px solid var(--line); background: #fff; border-top: 4pt solid; }
.pdca .c1 { border-top-color: #0a785b; } .pdca .c2 { border-top-color: #2e9a78; } .pdca .c3 { border-top-color: #c79a12; } .pdca .c4 { border-top-color: #064a38; }
.pdca b { display: block; color: var(--g9); margin: 3pt 0 2pt; font-size: 9.4pt; }
.pdca p { margin: 0; text-align: left; color: #3d4c46; }

/* pustaka */
.refs p { padding-left: 22pt; text-indent: -22pt; text-align: left; font-size: 9pt; margin-bottom: 6pt; }
"""


def front(d):
    out = []
    # halaman hak cipta
    out.append(f"""<section class="front legal page-break">
<div class="eyebrow">PEDULI APPS, MANUAL PENGGUNA</div>
<h1>Ketentuan Dokumen</h1><div class="rule"></div>
<h3>Hak cipta</h3><p>Hak cipta &copy; 2026 PT Nusa Rendra Jayatama (Nusa Safety). Dokumen ini disusun untuk PT Garuda Yamato Steel dan hanya boleh digandakan untuk keperluan internal perusahaan dalam rangka pelaksanaan program PEDULI. Penggandaan untuk pihak lain memerlukan izin tertulis.</p>
<h3>Penafian</h3><p>Manual ini menjelaskan perilaku aplikasi PEDULI versi {C.V}. Tampilan dan fungsi dapat berubah pada versi berikutnya. Bila terdapat perbedaan antara manual dan aplikasi, perilaku aplikasi pada versi yang dipakai menjadi acuan, dan perbedaan tersebut dilaporkan kepada Admin program untuk perbaikan edisi berikutnya. Manual ini tidak menggantikan kebijakan, prosedur, dan instruksi kerja K3 perusahaan.</p>
<h3>Merek</h3><p>PEDULI adalah nama program dan aplikasi Pelaporan Bahaya dan Upaya Pengendalian PT Garuda Yamato Steel. Google, Android, Chrome, iPhone, Safari, dan nama produk lain yang disebut dalam manual ini adalah merek dagang pemiliknya masing-masing dan dipakai semata untuk keperluan penjelasan.</p>
<h3>Tangkapan layar</h3><p>Seluruh gambar layar diambil dari aplikasi PEDULI versi {C.V} dengan data contoh fiktif. Nama orang, nomor laporan, foto, dan angka statistik pada gambar tidak mencerminkan kondisi sebenarnya di PT Garuda Yamato Steel.</p>
<h3>Umpan balik</h3><p>Saran perbaikan manual dapat disampaikan kepada Admin program PEDULI (tim HSE) melalui menu Konsultasi K3 dengan topik Lainnya, atau langsung kepada Nusa Safety selaku pengembang.</p>
</section>""")
    # kendali dokumen
    out.append(f"""<section class="front page-break">
<div class="eyebrow">KENDALI DOKUMEN</div><h1>Identitas dan Riwayat Dokumen</h1><div class="rule"></div>
<table class="kv">
<tr><td>Judul dokumen</td><td>Manual Pengguna PEDULI Apps (Pelaporan Bahaya dan Upaya Pengendalian)</td></tr>
<tr><td>Nomor dokumen</td><td>{C.NODOK}</td></tr>
<tr><td>Versi aplikasi</td><td>{C.V}</td></tr>
<tr><td>Edisi</td><td>{C.EDISI}</td></tr>
<tr><td>Klasifikasi</td><td>Internal PT Garuda Yamato Steel</td></tr>
<tr><td>Pemilik proses</td><td>Departemen HSE PT Garuda Yamato Steel</td></tr>
<tr><td>Penyusun</td><td>Nusa Safety, PT Nusa Rendra Jayatama</td></tr>
<tr><td>Alamat aplikasi</td><td>{C.URL}</td></tr>
<tr><td>Bahasa</td><td>Bahasa Indonesia</td></tr>
</table>
<div class="tcap"><b>Riwayat revisi</b></div>
<table class="t"><colgroup><col style="width:12%"><col style="width:16%"><col style="width:18%"><col style="width:54%"></colgroup>
<thead><tr><th>Edisi</th><th>Tanggal</th><th>Versi aplikasi</th><th>Uraian perubahan</th></tr></thead>
<tbody><tr><td class="b">1</td><td>11 November 2026</td><td>1.0.0</td><td>Terbitan pertama untuk uji coba lapangan, mencakup pelaporan bahaya, verifikasi, keputusan, tindak lanjut, notifikasi ponsel, poin dan reward, layanan konsultasi K3, statistik dan klasemen pelapor, serta administrasi.</td></tr>
<tr><td class="b">2</td><td>14 November 2026</td><td>{C.V}</td><td>Pilihan bahasa Indonesia dan Inggris, halaman Tentang PEDULI, penghapusan akun dan akun dummy, bilah progres dan halaman error, logo ringkas, serta pembaruan seluruh gambar layar.</td></tr></tbody></table>
<div class="tcap" style="margin-top:14pt"><b>Pengesahan</b></div>
<div class="sign">
<div><div class="r">DISUSUN OLEH</div><div class="sp"></div><div class="n">Nusa Safety<br>Tanggal:</div></div>
<div><div class="r">DIPERIKSA OLEH</div><div class="sp"></div><div class="n">Departemen HSE<br>Tanggal:</div></div>
<div><div class="r">DISAHKAN OLEH</div><div class="sp"></div><div class="n">Pengurus PT Garuda Yamato Steel<br>Tanggal:</div></div>
</div>
</section>""")
    # daftar isi
    lis = []
    for lvl, num, title, key in d.toc:
        if lvl == 0:
            lab = f"BAB {num}" if num.isdigit() else f"LAMPIRAN {num}"
            lis.append(f'<li class="l0"><span class="t"><span class="num">{lab}</span>{E(title)}</span><span class="dots"></span><span class="p">{pg(key)}</span></li>')
        else:
            lis.append(f'<li class="l1"><span class="t"><span class="num">{num}</span>{E(title)}</span><span class="dots"></span><span class="p">{pg(key)}</span></li>')
    lis.append(f'<li class="l0"><span class="t"><span class="num">&nbsp;</span>Daftar Pustaka</span><span class="dots"></span><span class="p">{pg("REFS")}</span></li>')
    out.append(f'<section class="front page-break"><div class="eyebrow">DAFTAR ISI</div><h1>Daftar Isi</h1><div class="rule"></div><ul class="toc">{"".join(lis)}</ul></section>')

    def lst(items, prefix):
        return '<ul class="toc">' + "".join(
            f'<li class="l1" style="padding-left:0"><span class="t"><span class="num" style="min-width:{56 if prefix=="Diagram Alir" else 46}pt">{prefix} {n}</span>{E(c)}</span><span class="dots"></span><span class="p">{pg(k)}</span></li>' for n, c, k in items) + "</ul>"
    out.append(f'<section class="front lists page-break"><div class="eyebrow">DAFTAR DIAGRAM DAN TABEL</div><h1>Daftar Diagram Alir dan Tabel</h1><div class="rule"></div>'
               f'<h2>Diagram alir</h2>{lst(d.diags, "Diagram Alir")}<h2>Tabel</h2>{lst(d.tabs, "Tabel")}</section>')
    out.append(f'<section class="front lists"><div class="eyebrow">DAFTAR GAMBAR</div><h1>Daftar Gambar</h1><div class="rule"></div>{lst(d.figs, "Gambar")}</section>')
    return "\n".join(out)


def body():
    d = C.build()
    refs = "".join(f"<p>{r}</p>" for r in C.REFS)
    main = d.html() + f'<section class="chapter"><div class="ch-head"><div class="eyebrow">RUJUKAN</div><h1>Daftar Pustaka{d.mark("REFS")}</h1><p class="lead">Regulasi, standar, dan pustaka yang menjadi dasar penyusunan aplikasi dan manual ini, ditulis menurut gaya APA edisi ketujuh.</p></div><div class="refs">{refs}</div></section>'
    html = f'<!doctype html><html lang="id"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{front(d)}{main}</body></html>'
    open(f"{D}/body.html", "w").write(html)
    return d


COVER_CSS = """
@page { size: A4; margin: 0; }
html, body { margin: 0; width: 210mm; height: 297mm; font-family: Inter, sans-serif; }
.pg { width: 210mm; height: 297mm; position: relative; overflow: hidden; }
"""


def cover():
    g = f"file://{REPO}/public/brand/gys-logo.png"
    p = f"file://{REPO}/public/brand/peduli-logo-compact.png"
    m = f"file://{REPO}/public/brand/peduli-mark.png"
    html = f"""<!doctype html><html lang="id"><head><meta charset="utf-8"><style>{COVER_CSS}
.top {{ height: 92mm; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 20mm; }}
.top img.g {{ height: 30mm; }} .top img.p {{ height: 26mm; }}
.band {{ position: absolute; top: 92mm; left: 0; right: 0; bottom: 0; background: linear-gradient(160deg, #0a785b 0%, #064a38 70%); color: #fff; padding: 22mm 20mm 0; }}
.band:before {{ content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3mm; background: #c79a12; }}
.mark {{ position: absolute; right: -28mm; bottom: 30mm; width: 150mm; opacity: .09; filter: brightness(0) invert(1); }}
.ey {{ font-size: 11pt; letter-spacing: .32em; font-weight: 700; color: #bfe3d4; }}
h1 {{ font-size: 44pt; margin: 6mm 0 3mm; font-weight: 800; letter-spacing: -.02em; line-height: 1.02; }}
h2 {{ font-size: 17pt; margin: 0 0 10mm; font-weight: 500; color: #e2f2eb; max-width: 150mm; line-height: 1.3; }}
.sub {{ font-size: 11pt; color: #cfe8dd; max-width: 140mm; line-height: 1.5; }}
.meta {{ position: absolute; left: 20mm; right: 20mm; bottom: 22mm; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6mm; border-top: 1px solid rgba(255,255,255,.3); padding-top: 6mm; font-size: 9pt; }}
.meta b {{ display: block; font-size: 7pt; letter-spacing: .16em; color: #9fd3bf; margin-bottom: 1.5mm; }}
.foot {{ position: absolute; left: 20mm; bottom: 9mm; font-size: 8.5pt; color: #bfe3d4; }}
</style></head><body><div class="pg">
<div class="top"><img class="g" src="{g}"><img class="p" src="{p}"></div>
<div class="band"><img class="mark" src="{m}">
<div class="ey">MANUAL PENGGUNA</div>
<h1>PEDULI Apps</h1>
<h2>Panduan Penggunaan Aplikasi Pelaporan Bahaya dan Upaya Pengendalian</h2>
<div class="sub">Untuk Pengawas, Superintendent, Manager, Direksi, dan Admin (tim HSE) PT Garuda Yamato Steel</div>
<div class="meta"><div><b>NOMOR DOKUMEN</b>{C.NODOK}</div><div><b>VERSI APLIKASI</b>{C.V}</div><div><b>EDISI</b>{C.EDISI}</div><div><b>BAHASA</b>Bahasa Indonesia</div></div>
<div class="foot">Disusun oleh Nusa Safety, PT Nusa Rendra Jayatama</div>
</div></div></body></html>"""
    open(f"{D}/cover.html", "w").write(html)
    back = f"""<!doctype html><html lang="id"><head><meta charset="utf-8"><style>{COVER_CSS}
.pg {{ background: linear-gradient(200deg, #0a785b 0%, #064a38 75%); color: #fff; }}
.c {{ position: absolute; left: 20mm; right: 20mm; top: 50%; transform: translateY(-50%); text-align: center; }}
.card {{ display: inline-flex; gap: 12mm; align-items: center; background: #fff; border-radius: 6mm; padding: 7mm 11mm; }}
.card img {{ height: 20mm; }}
p {{ font-size: 11pt; color: #d5ece2; line-height: 1.6; max-width: 130mm; margin: 12mm auto 0; }}
.q {{ font-size: 15pt; font-weight: 700; color: #fff; margin-top: 10mm; }}
.f {{ position: absolute; left: 0; right: 0; bottom: 16mm; text-align: center; font-size: 8.5pt; color: #a9d6c4; line-height: 1.6; }}
</style></head><body><div class="pg"><div class="c">
<div class="card"><img src="{g}"><img src="{p}"></div>
<div class="q">Lihat bahaya, laporkan, kendalikan bersama.</div>
<p>PEDULI menghubungkan pekerja di lapangan, pengawas, dan pimpinan dalam satu alur pelaporan bahaya dan pengendalian risiko yang terukur.</p>
</div><div class="f">PT Garuda Yamato Steel<br>Manual Pengguna PEDULI Apps, {C.NODOK}, versi aplikasi {C.V}, {C.EDISI}<br>Disusun oleh Nusa Safety, PT Nusa Rendra Jayatama</div></div></body></html>"""
    open(f"{D}/back.html", "w").write(back)


if __name__ == "__main__":
    d = body()
    cover()
    json.dump(d.keys, open(f"{D}/keys.json", "w"))
    print("toc", len(d.toc), "figs", len(d.figs), "tabs", len(d.tabs), "diags", len(d.diags), "keys", len(d.keys))
