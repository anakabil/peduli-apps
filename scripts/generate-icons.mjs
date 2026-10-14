import sharp from "sharp";
const src = "public/brand/peduli-logo-source.webp";
// Trim white margins for the full logo
await sharp(src).trim({ threshold: 20 }).png().toFile("public/brand/peduli-logo.png");
const meta = await sharp("public/brand/peduli-logo.png").metadata();
console.log("logo trimmed", meta.width, meta.height);
// Crop the shield mark (left part of the source)
const cropped = await sharp(src).extract({ left: 80, top: 175, width: 505, height: 458 }).png().toBuffer();
await sharp(cropped).trim({ threshold: 20 }).png().toFile("public/brand/peduli-mark.png");
const m = await sharp("public/brand/peduli-mark.png").metadata();
console.log("mark", m.width, m.height);
const side = Math.max(m.width, m.height);
const square = (pad, bg) => sharp("public/brand/peduli-mark.png").resize({ width: side, height: side, fit: "contain", background: bg }).extend({ top: pad, bottom: pad, left: pad, right: pad, background: bg });
for (const s of [192, 512]) {
  await square(Math.round(side * 0.08), "#ffffff").resize(s, s).png().toFile(`public/icons/icon-${s}.png`);
}
await square(Math.round(side * 0.22), "#ffffff").resize(512, 512).png().toFile("public/icons/maskable-512.png");
await square(Math.round(side * 0.1), "#ffffff").resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
await square(Math.round(side * 0.05), "#ffffff").resize(64, 64).png().toFile("public/icons/favicon-64.png");
await square(Math.round(side * 0.05), "#ffffff").resize(32, 32).png().toFile("src/app/favicon.png");
console.log("done");
