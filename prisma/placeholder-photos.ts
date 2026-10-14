/* Foto ilustrasi untuk data contoh (dibuat dari SVG sederhana, bukan foto sungguhan). */
import sharp from "sharp";

const SCENES = [
  { label: "Kabel terkelupas", bg: "#2f3e46", fg: "#e07a1f" },
  { label: "Area gerinda", bg: "#354f52", fg: "#c9a227" },
  { label: "Tumpukan coil", bg: "#3d405b", fg: "#f2cc8f" },
  { label: "Meja inspeksi", bg: "#52796f", fg: "#f1faee" },
  { label: "Lantai mesin potong", bg: "#4a4e69", fg: "#e07a1f" },
  { label: "Mezanin", bg: "#1b4332", fg: "#d8f3dc" },
];

export async function placeholderPhotos() {
  const out: Array<Uint8Array<ArrayBuffer>> = [];
  for (const s of SCENES) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.bg}"/><stop offset="1" stop-color="#111"/></linearGradient></defs>
      <rect width="960" height="720" fill="url(#g)"/>
      <g stroke="${s.fg}" stroke-width="6" opacity="0.55"><line x1="60" y1="620" x2="900" y2="560"/><line x1="60" y1="660" x2="900" y2="600"/></g>
      <rect x="120" y="180" width="520" height="300" rx="18" fill="#000" opacity="0.25"/>
      <circle cx="760" cy="230" r="70" fill="${s.fg}" opacity="0.8"/>
      <text x="60" y="110" font-family="Arial" font-size="40" font-weight="bold" fill="#fff">${s.label}</text>
      <text x="60" y="150" font-family="Arial" font-size="22" fill="#cfd8d3">Foto ilustrasi data contoh PEDULI Apps</text>
    </svg>`;
    const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 78 }).toBuffer();
    out.push(new Uint8Array(buf) as Uint8Array<ArrayBuffer>);
  }
  return out;
}
