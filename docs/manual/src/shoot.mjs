// Mengambil tangkapan layar manual dari aplikasi yang berjalan dengan data contoh (DEMO_MODE=true).
// Pemakaian: node docs/manual/src/shoot.mjs <folder raw> <url basis data contoh untuk psql>
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const [, , OUT, DBURL] = process.argv;
const B = process.env.BASE_URL || "http://localhost:3000";
fs.mkdirSync(OUT, { recursive: true });
const sql = (q) => execFileSync("psql", [DBURL, "-At", "-c", q]).toString().trim();
const rid = (num) => sql(`select id from "Report" where number='${num}'`);
const ID = {
  verif: sql(`select id from "Report" where status='MENUNGGU_VERIFIKASI' order by "createdAt" desc limit 1`),
  keputusan: sql(`select id from "Report" where status='MENUNGGU_KEPUTUSAN' order by "createdAt" desc limit 1`),
  perbaikan: rid("PDL-202611-0006"),
  penutupan: sql(`select id from "Report" where status='MENUNGGU_PENUTUPAN' order by "createdAt" desc limit 1`),
  selesai: sql(`select id from "Report" where status='SELESAI' order by "closedAt" desc nulls last limit 1`),
};
console.log(ID);

const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const DESK = { width: 1280, height: 800 };
const MOB = { width: 390, height: 844 };
const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#dfe7e1"/><path d="M0 64H256M0 160H256M90 0V256M200 0V256" stroke="#f7faf8" stroke-width="10"/><path d="M0 120C80 100 150 150 256 110" stroke="#cbd8cf" stroke-width="18" fill="none"/></svg>';

// Akun demo: label tombol peran dan urutannya (dua Manager, dua Superintendent, dua Pengawas)
async function session(label, nth, vp, fn, lang = "id") {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, locale: "id-ID", timezoneId: "Asia/Jakarta", geolocation: { latitude: -5.9955, longitude: 106.0152 }, permissions: ["geolocation"] });
  const p = await ctx.newPage();
  await p.route(/tile\.openstreetmap|arcgisonline/, (r) => r.fulfill({ status: 200, contentType: "image/svg+xml", body: tile }));
  await p.goto(`${B}/masuk`);
  await p.getByText(/Mode demo|Demo mode/).click();
  await p.locator(`button:has-text("${label}")`).nth(nth).click();
  await p.waitForURL(/beranda/);
  // Bahasa dipilih setelah masuk, karena tombol akun demo berlabel menurut bahasa
  if (lang !== "id") await ctx.addCookies([{ name: "peduli_lang", value: lang, url: B }]);
  await fn(p);
  await ctx.close();
}
const go = async (p, path) => { await p.goto(B + path, { waitUntil: "networkidle" }); await p.waitForTimeout(700); };
const shot = (p, name, opts = {}) => p.screenshot({ path: `${OUT}/${name}.png`, ...opts });
const FLAT = "header.sticky,.sticky{position:relative!important;top:auto!important} nav.fixed{display:none!important} .shadow-float{box-shadow:none!important}";
const flat = (p) => p.addStyleTag({ content: FLAT });
const el = async (p, sel, name) => { await flat(p); const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await l.screenshot({ path: `${OUT}/${name}.png` }); };
const card = (title) => `xpath=//h3[normalize-space()="${title}"]/ancestor::*[contains(concat(" ",normalize-space(@class)," ")," card ")][1]`;

// Halaman masuk (tanpa sesi)
{
  const ctx = await b.newContext({ viewport: DESK, deviceScaleFactor: 2, locale: "id-ID" });
  const p = await ctx.newPage();
  await go(p, "/masuk"); await shot(p, "masuk-desk");
  await go(p, "/tentang"); await shot(p, "tentang-desk", { fullPage: true });
  await ctx.close();
  const m = await b.newContext({ viewport: MOB, deviceScaleFactor: 2, locale: "id-ID" });
  const q = await m.newPage(); await go(q, "/masuk"); await shot(q, "m-masuk"); await m.close();
}

await session("Pengawas", 0, DESK, async (p) => {
  await go(p, "/beranda"); await shot(p, "beranda-desk");
  await el(p, 'button:has-text("Butuh konsultasi terkait SMK3")', "konsultasi-prompt");
  await go(p, "/laporan"); await shot(p, "laporan-desk");
  await go(p, "/notifikasi"); await shot(p, "notifikasi-desk");
  await go(p, "/poin"); await shot(p, "poin-desk");
  await go(p, "/konsultasi"); await flat(p); await shot(p, "konsultasi-tanya", { fullPage: true });
  await go(p, "/konsultasi?tab=terbuka"); await shot(p, "konsultasi-terbuka");
});
await session("Pengawas", 0, DESK, async (p) => {
  await go(p, "/beranda"); await shot(p, "beranda-en-desk");
}, "en");
await session("Pengawas", 0, MOB, async (p) => {
  await go(p, "/beranda"); await shot(p, "m-beranda");
  await p.getByRole("button", { name: "Menu" }).click(); await p.waitForTimeout(500); await shot(p, "m-menu");
  await p.keyboard.press("Escape");
  await go(p, "/laporan"); await shot(p, "m-laporan");
  await go(p, "/poin"); await shot(p, "m-poin");
  await go(p, "/lapor"); await flat(p); await p.waitForTimeout(800); await shot(p, "m-lapor-full", { fullPage: true });
  await go(p, "/profil"); await el(p, card("Notifikasi ponsel"), "m-profil-notif");
});
await session("Superintendent", 0, DESK, async (p) => {
  await go(p, "/verifikasi"); await shot(p, "verifikasi-desk");
  await go(p, `/laporan/${ID.verif}`); await el(p, card("Verifikasi laporan Pengawas"), "panel-verifikasi");
  await go(p, "/tindak-lanjut"); await shot(p, "tindaklanjut-desk");
  await go(p, `/laporan/${ID.perbaikan}`); await el(p, card("Pembaruan perbaikan"), "panel-progres");
});
await session("Manager", 0, DESK, async (p) => {
  await go(p, "/keputusan"); await shot(p, "keputusan-desk");
  await go(p, `/laporan/${ID.keputusan}`); await el(p, card("Keputusan Manager"), "panel-keputusan");
  await go(p, `/laporan/${ID.selesai}`); await shot(p, "detail-desk");
  await go(p, "/konsultasi?tab=jawab"); await shot(p, "konsultasi-jawab");
});
await session("Manager", 1, DESK, async (p) => {
  await go(p, `/laporan/${ID.penutupan}`); await el(p, card("Verifikasi hasil dan penutupan"), "panel-penutupan");
});
await session("Admin", 0, DESK, async (p) => {
  await go(p, "/statistik"); await shot(p, "statistik-desk");
  await el(p, card("Klasemen pelapor"), "klasemen");
  await go(p, "/statistik"); await el(p, card("Laporan ditolak"), "ditolak");
  await go(p, "/konsultasi?tab=saring"); await shot(p, "konsultasi-saring");
  await go(p, "/admin/pengguna"); await shot(p, "pengguna-desk");
  await go(p, "/admin/area"); await shot(p, "area-desk");
  await go(p, "/admin/akuntabilitas"); await shot(p, "akuntabilitas-desk");
  await go(p, "/admin/reward"); await shot(p, "reward-desk");
  await go(p, "/admin/penukaran"); await shot(p, "penukaran-desk");
  await go(p, "/admin/pengaturan"); await shot(p, "pengaturan-desk");
  await el(p, card("Notifikasi ponsel"), "pengaturan-notif");
  await go(p, "/admin/audit"); await shot(p, "audit-desk");
  await go(p, "/admin/data-uji"); await shot(p, "datauji-desk");
});
await b.close();
console.log("selesai:", fs.readdirSync(OUT).length, "berkas");
