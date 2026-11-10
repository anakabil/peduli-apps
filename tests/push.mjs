// Uji notifikasi ponsel (Web Push) dari ujung ke ujung dengan layanan push tiruan HTTPS lokal.
// Jalankan server aplikasi dengan NODE_TLS_REJECT_UNAUTHORIZED=0 agar sertifikat lokal diterima, lalu:
//   PUSH_CERT_DIR=<folder berisi cert.pem dan key.pem> node tests/push.mjs
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { chromium } from "playwright";
import ece from "http_ece";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CERT = process.env.PUSH_CERT_DIR;
const PORT = 8443;
const ok = (c, m) => {
  if (!c) throw new Error("GAGAL: " + m);
  console.log("OK  ", m);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Layanan push tiruan: mencatat setiap kiriman; endpoint /gone menjawab 410 seperti langganan kedaluwarsa
const received = [];
const server = https.createServer({ cert: fs.readFileSync(path.join(CERT, "cert.pem")), key: fs.readFileSync(path.join(CERT, "key.pem")) }, (req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    received.push({ path: req.url, headers: req.headers, body: Buffer.concat(chunks) });
    res.writeHead(req.url.includes("gone") ? 410 : 201).end();
  });
});
await new Promise((r) => server.listen(PORT, r));

function device(name) {
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  return {
    ecdh,
    auth,
    sub: { endpoint: `https://localhost:${PORT}/push/${name}`, keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: auth.toString("base64url") } },
  };
}
function decrypt(dev, body) {
  return JSON.parse(ece.decrypt(body, { version: "aes128gcm", privateKey: dev.ecdh, authSecret: dev.auth.toString("base64url") }).toString("utf8"));
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await browser.newContext()).newPage();
async function login(label) {
  await page.context().clearCookies();
  await page.goto(`${BASE}/masuk`);
  await page.getByText("Mode demo").click();
  await page.locator(`button:has-text("${label}")`).first().click();
  await page.waitForURL(/beranda/, { timeout: 30000 });
}
const photo = fs.readFileSync(new URL("../public/icons/icon-512.png", import.meta.url));
const report = (n) => page.request.post(`${BASE}/api/laporan`, { multipart: { category: "KONDISI_TIDAK_AMAN", hazardType: "PERALATAN", riskLevel: "SEDANG", description: `Uji notifikasi ponsel ${n}, kabel terkelupas.`, impact: "Tersengat listrik.", lat: "-5.9955", lng: "106.0152", accuracyM: "5", photos: { name: "f.png", mimeType: "image/png", buffer: photo } } });

// 1. Superintendent mendaftarkan perangkat
await login("Superintendent");
const key = await (await page.request.get(`${BASE}/api/push/key`)).json();
ok(typeof key.publicKey === "string" && key.publicKey.length > 80, "Kunci publik VAPID tersedia");
const supt = device("supt");
ok((await page.request.post(`${BASE}/api/push/subscribe`, { data: supt.sub })).ok(), "Perangkat Superintendent terdaftar");
const bad = await page.request.post(`${BASE}/api/push/subscribe`, { data: { endpoint: "http://contoh.local/x", keys: { p256dh: "x", auth: "y" } } });
ok(bad.status() === 400, "Langganan tidak valid ditolak");

// 2. Uji kirim ke perangkat sendiri
const t = await (await page.request.post(`${BASE}/api/push/test`)).json();
ok(t.ok && t.sent === 1, "Notifikasi uji terkirim");
const first = received.at(-1);
ok(first.headers["content-encoding"] === "aes128gcm" && /^vapid t=/.test(first.headers.authorization ?? ""), "Kiriman terenkripsi (aes128gcm) dan bertanda VAPID");
ok(decrypt(supt, first.body).title === "Notifikasi PEDULI aktif", "Isi notifikasi uji dapat dibuka oleh perangkat");

// 3. Laporan baru dari Pengawas memicu notifikasi tugas verifikasi ke Superintendent
await login("Pengawas");
let before = received.length;
const r1 = await (await report(1)).json();
ok(r1.ok, `Pengawas membuat laporan ${r1.number}`);
for (let i = 0; i < 20 && received.length === before; i++) await wait(250);
const got = received.slice(before).find((x) => x.path.endsWith("/supt"));
ok(!!got, "Superintendent menerima notifikasi ponsel");
const msg = decrypt(supt, got.body);
ok(msg.title.includes("perlu verifikasi") && msg.url === `/laporan/${r1.id}`, `Notifikasi berisi tugas dan tautan laporan: "${msg.title}"`);
ok(got.headers.urgency === "high", "Tugas verifikasi dikirim dengan prioritas tinggi");

// 4. Superintendent mematikan jenis "Laporan perlu verifikasi" di Profil
await login("Superintendent");
await page.goto(`${BASE}/profil`, { waitUntil: "networkidle" });
await page.getByRole("checkbox", { name: /Laporan perlu verifikasi/ }).uncheck();
await Promise.all([page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/profil")), page.getByRole("button", { name: "Simpan pilihan" }).click()]);
await page.reload({ waitUntil: "networkidle" });
ok(!(await page.getByRole("checkbox", { name: /Laporan perlu verifikasi/ }).isChecked()), "Pilihan jenis notifikasi tersimpan di Profil");
await login("Pengawas");
before = received.length;
ok((await (await report(2)).json()).ok, "Laporan kedua dibuat");
await wait(3000);
ok(!received.slice(before).some((x) => x.path.endsWith("/supt")), "Jenis yang dimatikan pengguna tidak dikirim ke ponselnya");

// 5. Langganan kedaluwarsa (410) dibersihkan otomatis
await login("Superintendent");
await page.request.post(`${BASE}/api/push/subscribe`, { data: device("gone").sub });
const t2 = await (await page.request.post(`${BASE}/api/push/test`)).json();
ok(t2.sent === 1 && t2.failed === 1, "Satu perangkat aktif, satu kedaluwarsa");
const t3 = await (await page.request.post(`${BASE}/api/push/test`)).json();
ok(t3.sent === 1 && t3.failed === 0, "Perangkat kedaluwarsa sudah dihapus");

// 6. Pengaturan admin dapat mematikan jenis tertentu untuk semua pengguna
await login("Admin");
await page.goto(`${BASE}/admin/pengaturan`, { waitUntil: "networkidle" });
ok(await page.getByText("Notifikasi ponsel").count(), "Kartu Notifikasi ponsel tampil di Pengaturan alur");

await browser.close();
server.close();
console.log("\nSELESAI: notifikasi ponsel berfungsi.");
