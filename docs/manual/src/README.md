# Sumber Manual Pengguna PEDULI

Skrip untuk menyusun `docs/Manual_Pengguna_PEDULI_v<versi>.pdf` dari tangkapan layar aplikasi yang sebenarnya.

| Berkas | Fungsi |
| --- | --- |
| `content.py` | Isi manual per bab, lampiran, dan daftar pustaka (APA 7) |
| `lib.py` | Penomoran bab, tabel, gambar, prosedur, catatan, dan penanda halaman |
| `flow.py`, `diagrams.py` | Diagram alir berlajur dengan simbol ISO 5807 |
| `build.py` | Menyusun HTML isi, sampul depan, dan sampul belakang |
| `render.mjs` | Merender HTML ke PDF dengan Playwright (A4, kepala dan kaki halaman) |
| `pages.py` | Membaca nomor halaman tiap bab, tabel, dan gambar dari PDF untuk daftar isi |
| `shoot.mjs` | Mengambil tangkapan layar dari aplikasi yang berjalan dengan data contoh |
| `prep_img.py` | Mengompres gambar dan membuat komposit tampilan ponsel |

## Menyusun ulang

Kebutuhan: Node.js, Python 3 dengan Pillow, poppler-utils (`pdftotext`, `pdfunite`), font Inter, dan aplikasi yang berjalan di `http://localhost:3000` dengan `DEMO_MODE=true` serta basis data hasil `prisma/seed.ts`.

```bash
cd docs/manual/src
node shoot.mjs raw "<url psql basis data contoh>"   # tangkapan layar ke raw/
python3 prep_img.py                                  # raw/ -> img/
python3 build.py && node render.mjs && python3 pages.py
python3 build.py pages.json && node render.mjs body && python3 pages.py   # ulangi sampai nomor halaman stabil
pdfunite cover.pdf body.pdf back.pdf manual.pdf
```

Variabel `CHROME` dapat diisi jalur Chromium bila versi Playwright tidak cocok dengan peramban terpasang.
