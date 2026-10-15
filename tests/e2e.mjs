/* Uji alur ujung ke ujung PEDULI Apps dengan akun demo. Jalankan: node tests/e2e.mjs (server dev di :3000) */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const S = process.env.SHOTS || "/tmp/claude-0/-home-user-peduli-apps/e5dec931-7017-51d3-9f7e-0a1a68121378/scratchpad/shots";
const tmp = fs.mkdtempSync("/tmp/peduli-e2e-");
const photo = path.join(tmp, "foto.jpg");
await sharp({ create: { width: 1600, height: 1200, channels: 3, background: "#2f3e46" } }).jpeg().toFile(photo);

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, geolocation: { latitude: -5.9955, longitude: 106.0152 }, permissions: ["geolocation"], acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error" && !/favicon|404/.test(m.text())) errors.push(m.text().slice(0, 200)); });
page.on("response", (r) => { if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`); });
const ok = (cond, msg) => { if (!cond) throw new Error("GAGAL: " + msg); console.log("OK  ", msg); };

async function login(label, nth = 0) {
  await page.goto(`${BASE}/masuk`, { waitUntil: "networkidle" });
  if (!(await page.locator('button:has-text("Mode demo")').count())) {
    await page.screenshot({ path: `${S}/e2e-gagal-masuk.png`, fullPage: true });
    throw new Error(`Mode demo tidak tersedia di ${page.url()}: ${(await page.textContent("body")).slice(0, 300)}`);
  }
  await page.getByText("Mode demo").click();
  await page.locator(`button:has-text("${label}")`).nth(nth).click();
  await page.waitForURL(/beranda/, { timeout: 30000 });
}
async function logout() {
  await page.goto(`${BASE}/profil`);
  await page.locator('button:has-text("Keluar")').first().click();
  await page.waitForURL(/masuk/);
}

// 1. Pengawas membuat laporan dengan foto dan GPS
await login("Pengawas");
await page.goto(`${BASE}/lapor`, { waitUntil: "networkidle" });
await page.waitForSelector("text=GPS terkunci", { timeout: 15000 });
await page.locator('input[type="file"]').setInputFiles(photo);
await page.waitForSelector('img[alt="Foto 1"]');
await page.getByRole("button", { name: "Nyaris celaka" }).click();
await page.getByRole("button", { name: /^Tinggi/ }).click();
await page.locator('input[placeholder^="Contoh: Gudang"]').fill("Jalur forklift 2, dekat rak B");
await page.locator('textarea[placeholder^="Tulis uraian"]').fill("Forklift hampir menabrak pekerja di tikungan rak B karena cermin cembung pecah.");
await page.locator('textarea[placeholder^="Contoh: pasang"]').fill("Ganti cermin cembung dan pasang pembatas kecepatan.");
await page.screenshot({ path: `${S}/e2e-01-form.png`, fullPage: true });
await page.getByRole("button", { name: "Kirim laporan" }).click();
await page.waitForURL(/\/laporan\/[a-z0-9]+$/, { timeout: 30000 });
const reportUrl = page.url();
const number = (await page.locator("span.font-mono").first().textContent()).trim();
ok(/^PDL-\d{6}-\d{4}$/.test(number), `Laporan dibuat dengan nomor ${number}`);
ok(await page.getByText("Menunggu verifikasi").count(), "Status awal menunggu verifikasi (jalur A)");
ok(await page.getByText("Eskalasi Manager").count(), "Risiko Tinggi dieskalasi otomatis");
ok(await page.getByText("Produksi").count(), "Area ditentukan dari koordinat GPS");
await page.screenshot({ path: `${S}/e2e-02-detail-baru.png`, fullPage: true });
await logout();

// 2. Superintendent memverifikasi valid
await login("Superintendent", 0);
await page.goto(`${BASE}/verifikasi`, { waitUntil: "networkidle" });
ok(await page.getByText(number).count(), "Laporan muncul di antrean verifikasi Superintendent");
await page.goto(reportUrl, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Valid" }).click();
await page.locator('textarea[name="note"]').fill("Foto dan lokasi sesuai, uraian jelas.");
await page.getByRole("button", { name: "Simpan verifikasi" }).click();
await page.waitForSelector("text=Menunggu keputusan", { timeout: 15000 });
ok(true, "Verifikasi valid tersimpan, status menunggu keputusan");
ok(await page.getByText("Poin diberikan kepada pelapor").count(), "Poin diberikan setelah verifikasi");
await page.screenshot({ path: `${S}/e2e-03-verifikasi.png`, fullPage: true });
await logout();

// 3. Manager memutuskan setuju
await login("Manager", 0);
await page.goto(`${BASE}/keputusan`, { waitUntil: "networkidle" });
ok(await page.getByText(number).count(), "Laporan muncul di antrean keputusan Manager");
await page.goto(reportUrl, { waitUntil: "networkidle" });
await page.locator('select[name="picId"]').selectOption({ index: 1 });
await page.locator('input[name="resourceTenaga"]').fill("2 teknisi");
await page.locator('input[name="resourceBiaya"]').fill("Rp2.000.000");
const target = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
await page.locator('input[name="targetDate"]').fill(target);
await page.getByRole("button", { name: "Rekayasa teknik" }).click();
await page.getByRole("button", { name: "Simpan keputusan" }).click();
await page.waitForSelector("text=Dalam perbaikan", { timeout: 15000 });
ok(true, "Keputusan Manager tersimpan, status dalam perbaikan");
await page.screenshot({ path: `${S}/e2e-04-keputusan.png`, fullPage: true });

// 4. Manager memperbarui progres dan menyelesaikan perbaikan
await page.locator('input[type="checkbox"]').first().check();
await page.locator('textarea[name="note"]').fill("Cermin cembung diganti, pembatas kecepatan dipasang.");
await page.getByRole("button", { name: "Ajukan penutupan" }).click();
await page.waitForSelector("text=Menunggu penutupan", { timeout: 15000 });
ok(true, "Perbaikan selesai, menunggu penutupan");

// 5. Manager menutup dengan usulan diterapkan
await page.locator('input[name="suggestionApplied"]').check();
await page.locator('textarea[name="note"]').fill("Hasil diverifikasi di lapangan.");
await page.getByRole("button", { name: "Simpan" }).last().click();
await page.waitForSelector("text=Diterapkan", { timeout: 15000 });
const pointsText = await page.getByText("Poin diberikan kepada pelapor").textContent();
ok(/\d+/.test(pointsText), `Laporan ditutup dengan bonus usulan: ${pointsText.trim()}`);
await page.screenshot({ path: `${S}/e2e-05-selesai.png`, fullPage: true });

// Cetak laporan
await page.goto(`${reportUrl}/cetak`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${S}/e2e-06-cetak.png`, fullPage: true });
await logout();

// 6. Pengawas melihat poin dan menukar hadiah
await login("Pengawas");
await page.goto(`${BASE}/poin`, { waitUntil: "networkidle" });
ok(await page.getByText("Bonus usulan perbaikan diterapkan").count(), "Riwayat poin memuat bonus usulan");
await page.screenshot({ path: `${S}/e2e-07-poin.png`, fullPage: true });
await page.getByRole("button", { name: "Tukar poin" }).first().click();
await page.getByRole("button", { name: "Ya, tukar" }).click();
await page.waitForSelector("text=diajukan", { timeout: 15000 });
ok(true, "Penukaran hadiah diajukan");
await page.goto(`${BASE}/notifikasi`, { waitUntil: "networkidle" });
ok(await page.getByText(number).count(), "Notifikasi pelapor memuat nomor laporan");
await logout();

// 7. Admin: penukaran, statistik, ekspor
await login("Admin");
await page.goto(`${BASE}/admin/penukaran`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Selesai" }).first().click();
await page.waitForTimeout(1500);
ok(await page.getByText("Riwayat").count(), "Penukaran diproses admin");
await page.goto(`${BASE}/statistik`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
for (const [label, ext] of [["PDF", "pdf"], ["PowerPoint", "pptx"], ["CSV", "csv"]]) {
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), page.getByRole("button", { name: label }).click()]);
  const file = path.join(tmp, dl.suggestedFilename());
  await dl.saveAs(file);
  const size = fs.statSync(file).size;
  ok(size > 1000 && file.endsWith("." + ext), `Ekspor ${label} terunduh (${Math.round(size / 1024)} KB)`);
}
for (const p of ["/admin/pengguna", "/admin/area", "/admin/reward", "/admin/pengaturan", "/admin/audit"]) {
  await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${S}/e2e-admin${p.replace(/\//g, "_")}.png`, fullPage: true });
}
ok(true, "Halaman admin dapat dibuka");
const cronNoAuth = await page.request.get(`${BASE}/api/cron/pengingat`);
ok(cronNoAuth.status() === 401, "Endpoint cron menolak permintaan tanpa rahasia");
const cron = await page.request.get(`${BASE}/api/cron/pengingat`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET || "uji-cron-lokal"}` } });
ok(cron.ok() && (await cron.json()).ok === true, "Endpoint cron pengingat berjalan dengan rahasia");
await logout();

// 8. Pengiriman bersamaan: nomor laporan harus unik (uji kondisi balapan)
await login("Pengawas");
const photoBuf = fs.readFileSync(photo);
const submit = (i) => page.request.post(`${BASE}/api/laporan`, { multipart: { category: "KONDISI_TIDAK_AMAN", riskLevel: "RENDAH", description: `Uji pengiriman bersamaan nomor ${i}, lantai licin.`, lat: "-5.9955", lng: "106.0152", accuracyM: "5", clientId: `race-${Date.now()}-${i}`, photos: { name: "foto.jpg", mimeType: "image/jpeg", buffer: photoBuf } } });
const results = await Promise.all([0, 1, 2, 3, 4].map(submit));
const bodies = await Promise.all(results.map((r) => r.json()));
const numbers = bodies.map((b) => b.number);
ok(results.every((r) => r.ok()) && new Set(numbers).size === 5, `Lima pengiriman bersamaan memperoleh nomor unik: ${numbers.join(", ")}`);
// Idempoten: clientId sama tidak membuat laporan baru
const cid = `idem-${Date.now()}`;
const first = await (await page.request.post(`${BASE}/api/laporan`, { multipart: { category: "ERGONOMI", riskLevel: "RENDAH", description: "Uji idempoten antrean luring.", clientId: cid, photos: { name: "foto.jpg", mimeType: "image/jpeg", buffer: photoBuf } } })).json();
const second = await (await page.request.post(`${BASE}/api/laporan`, { multipart: { category: "ERGONOMI", riskLevel: "RENDAH", description: "Uji idempoten antrean luring.", clientId: cid, photos: { name: "foto.jpg", mimeType: "image/jpeg", buffer: photoBuf } } })).json();
ok(first.id === second.id && second.duplicate === true, "Pengiriman ulang dengan clientId sama tidak menggandakan laporan");
// Berkas non-gambar ditolak
const bad = await page.request.post(`${BASE}/api/laporan`, { multipart: { category: "ERGONOMI", riskLevel: "RENDAH", description: "Uji berkas berbahaya ditolak.", photos: { name: "x.html", mimeType: "text/html", buffer: Buffer.from("<script>1</script>") } } });
ok(bad.status() === 400, "Unggahan berkas non-gambar ditolak");

await browser.close();
if (errors.length) { console.log("Kesalahan konsol/HTTP:"); errors.forEach((e) => console.log(" -", e)); }
console.log("\nSELESAI: seluruh alur ujung ke ujung lulus.");
