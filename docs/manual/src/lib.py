"""Kerangka penulisan manual: penomoran bab, tabel, gambar, prosedur, diagram alir, dan penanda halaman."""
from html import escape
import re

E = escape


class Doc:
    def __init__(self):
        self.parts = []
        self.toc = []  # (level, num, title, key)
        self.figs, self.tabs, self.diags = [], [], []
        self.ch = None
        self.sec = 0
        self.fig_n = self.tab_n = self.proc_n = 0
        self.diag_n = 0
        self.keys = []

    # penanda tak terlihat untuk mencari nomor halaman pada PDF
    def mark(self, key):
        self.keys.append(key)
        return f'<span class="mk">QQ{key}QQ</span>'

    def add(self, html):
        self.parts.append(html)

    def chapter(self, num, title, lead, kind="BAB", toc_items=None):
        self.ch = str(num)
        self.sec = 0
        self.fig_n = self.tab_n = self.proc_n = 0
        key = f"C{self.ch}"
        self.toc.append((0, self.ch, title, key))
        big = self.ch.zfill(2) if self.ch.isdigit() else self.ch
        label = f"{kind} {self.ch}" if kind else ""
        self.add(f'<section class="chapter"><div class="ch-head"><div class="ch-big">{big}</div>'
                 f'<div class="eyebrow">{E(label)}</div><h1>{E(title)}{self.mark(key)}</h1><p class="lead">{lead}</p></div>')
        self._pending_box = True

    def in_chapter(self, items):
        lis = "".join(f'<li><b>{self.ch}.{i + 1}</b> {E(t)}</li>' for i, t in enumerate(items))
        self.add(f'<div class="inbox"><div class="eyebrow small">DALAM BAB INI</div><ul>{lis}</ul></div>')

    def end_chapter(self):
        self.add("</section>")

    def section(self, title):
        self.sec += 1
        num = f"{self.ch}.{self.sec}"
        key = f"S{num.replace('.', 'x')}"
        self.toc.append((1, num, title, key))
        self.add(f'<h2><span class="num">{num}</span> {E(title)}{self.mark(key)}</h2>')
        return num

    def sub(self, num, title):
        self.add(f'<h3><span class="num">{num}</span> {E(title)}</h3>')

    def p(self, *texts):
        for t in texts:
            self.add(f"<p>{t}</p>")

    def ul(self, items, ordered=False):
        tag = "ol" if ordered else "ul"
        self.add(f"<{tag}>" + "".join(f"<li>{i}</li>" for i in items) + f"</{tag}>")

    def table(self, caption, head, rows, widths=None, first_bold=True, cls=""):
        self.tab_n += 1
        num = f"{self.ch}.{self.tab_n}"
        key = f"T{num.replace('.', 'x')}"
        self.tabs.append((num, caption, key))
        cols = "".join(f'<col style="width:{w}">' for w in widths) if widths else ""
        th = "".join(f"<th>{h}</th>" for h in head)
        trs = []
        for r in rows:
            tds = "".join(f'<td class="{"b" if (i == 0 and first_bold) else ""}">{c}</td>' for i, c in enumerate(r))
            trs.append(f"<tr>{tds}</tr>")
        keep = len(rows) <= 9
        cap = f'<div class="tcap"><b>Tabel {num}</b> {E(caption)}{self.mark(key)}</div>'
        tbl = f'<table class="t {cls}"><colgroup>{cols}</colgroup><thead><tr>{th}</tr></thead><tbody>{"".join(trs)}</tbody></table>'
        self.add(f'<div class="keep">{cap}{tbl}</div>' if keep else cap + tbl)

    def figure(self, img, caption, width="100%", cls=""):
        self.fig_n += 1
        num = f"{self.ch}.{self.fig_n}"
        key = f"G{num.replace('.', 'x')}"
        self.figs.append((num, caption, key))
        self.add(f'<figure class="{cls}"><img src="img/{img}.jpg" style="width:{width}"/>'
                 f'<figcaption><b>Gambar {num}</b> {E(caption)}{self.mark(key)}</figcaption></figure>')

    def diagram(self, svg, caption):
        self.diag_n += 1
        key = f"D{self.diag_n}"
        self.diags.append((self.diag_n, caption, key))
        self.add(f'<figure class="diag">{svg}<figcaption><b>Diagram Alir {self.diag_n}</b> {E(caption)}{self.mark(key)}</figcaption></figure>')
        return self.diag_n

    def procedure(self, title, steps, result=None):
        self.proc_n += 1
        num = f"{self.ch}.{self.proc_n}"
        lis = "".join(f'<li><span class="n">{i + 1}</span><span>{s}</span></li>' for i, s in enumerate(steps))
        res = f'<div class="res"><b>Hasil.</b> {result}</div>' if result else ""
        self.add(f'<div class="proc"><div class="ph"><span class="eyebrow small">PROSEDUR {num}</span> <b>{E(title)}</b></div><ol>{lis}</ol>{res}</div>')
        return num

    def note(self, kind, text):
        icons = {
            "catatan": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
            "tips": '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
            "perhatian": '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
            "peringatan": '<polygon points="7.9 2 16.1 2 22 7.9 22 16.1 16.1 22 7.9 22 2 16.1 2 7.9"/><path d="M12 8v4M12 16h.01"/>',
        }
        self.add(f'<div class="note {kind}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{icons[kind]}</svg>'
                 f'<div><div class="nt">{kind.upper()}</div><div>{text}</div></div></div>')

    def html(self):
        return "\n".join(self.parts)


def ui(t):
    """Nama tombol, menu, atau kolom persis seperti di layar"""
    return f'<b class="ui">{E(t)}</b>'


def path(*items):
    return ' <span class="chev">&rsaquo;</span> '.join(ui(i) for i in items)
