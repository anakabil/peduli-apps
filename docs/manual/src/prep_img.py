"""Menyiapkan gambar manual: JPEG terkompresi dan komposit ponsel."""
import os, sys
from PIL import Image, ImageDraw

D = os.path.dirname(os.path.abspath(__file__))
RAW, OUT = f"{D}/raw", f"{D}/img"
os.makedirs(OUT, exist_ok=True)


def rounded(im, r, border="#cfdcd5", bw=3):
    im = im.convert("RGB")
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.width - 1, im.height - 1], r, fill=255)
    bg = Image.new("RGB", im.size, "white")
    bg.paste(im, (0, 0), mask)
    ImageDraw.Draw(bg).rounded_rectangle([0, 0, im.width - 1, im.height - 1], r, outline=border, width=bw)
    return bg


def save(im, name, w=1700, q=82):
    im = im.convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(f"{OUT}/{name}.jpg", quality=q, optimize=True, progressive=True)


def compose(images, gap=40, pad=20):
    h = max(i.height for i in images)
    W = sum(i.width for i in images) + gap * (len(images) - 1) + pad * 2
    c = Image.new("RGB", (W, h + pad * 2), "white")
    x = pad
    for i in images:
        c.paste(i, (x, pad))
        x += i.width + gap
    return c


def phone(name, crop=None, w=520):
    im = Image.open(f"{RAW}/{name}.png")
    if crop:
        im = im.crop(crop)
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    return rounded(im, 34)


for f in os.listdir(RAW):
    n = f[:-4]
    if n.startswith("m-"):
        continue
    im = Image.open(f"{RAW}/{f}")
    if n == "konsultasi-tanya":
        im = im.crop((0, 0, im.width, min(im.height, 2200)))
    save(rounded(im, 10, bw=2) if n.endswith("-desk") or n.startswith("konsultasi-") and n != "konsultasi-prompt" else im, n, w=1700 if im.width > 1500 else 1100)

save(compose([phone("m-beranda"), phone("m-menu"), phone("m-laporan")]), "m-tiga", w=1700)
save(compose([phone("m-masuk"), phone("m-poin")]), "m-masuk-poin", w=1300)
L = Image.open(f"{RAW}/m-lapor-full.png")
h = L.height
cuts = [(0, 300, 780, 300 + h // 3), (0, 300 + h // 3 - 40, 780, 300 + 2 * h // 3 - 40), (0, 300 + 2 * h // 3 - 80, 780, h - 220)]
save(compose([phone("m-lapor-full", c) for c in cuts]), "m-lapor", w=1700)
save(Image.open(f"{RAW}/m-profil-notif.png"), "m-profil-notif", w=700)
print(sorted(os.listdir(OUT)))
