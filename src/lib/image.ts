import sharp from "sharp";

/** Gambar kecil untuk daftar laporan (lebar 360 px). Bila gagal, daftar memakai foto asli. */
export async function makeThumb(data: Uint8Array): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    const buf = await sharp(data).rotate().resize({ width: 360, height: 360, fit: "cover" }).jpeg({ quality: 70, mozjpeg: true }).toBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

/** Foto hadiah: sisi terpanjang 800 px, WebP (transparansi PNG tetap terjaga) */
export async function normalizeRewardPhoto(data: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const buf = await sharp(data).rotate().resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  return new Uint8Array(buf);
}
