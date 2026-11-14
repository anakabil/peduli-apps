import { chromium } from "/home/user/peduli-apps/node_modules/playwright/index.mjs";
const D = new URL(".", import.meta.url).pathname;
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
const p = await b.newPage();
const which = process.argv[2] || "all";
const st = "font-family:Inter,sans-serif;font-size:7.4pt;color:#5b6b64;width:100%;padding:0 16mm;display:flex;justify-content:space-between;align-items:center;";
const header = `<div style="${st}"><span><b style="color:#064a38">PEDULI Apps</b>&nbsp; Manual Pengguna</span><span>Versi aplikasi 1.1.0, Edisi 2, November 2026</span></div>`;
const footer = `<div style="${st}border-top:0;"><span>PT Garuda Yamato Steel, Nusa Safety</span><span style="display:inline-block;min-width:22px;text-align:center;background:#0a785b;color:#fff;border-radius:9px;padding:1px 6px;font-weight:700" class="pageNumber"></span></div>`;
if (which === "all" || which === "body") {
  await p.goto("file://" + D + "body.html", { waitUntil: "networkidle" });
  await p.pdf({ path: D + "body.pdf", format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: header, footerTemplate: footer, margin: { top: "19mm", bottom: "18mm", left: "16mm", right: "16mm" } });
}
if (which === "all" || which === "cover") {
  for (const n of ["cover", "back"]) {
    await p.goto("file://" + D + n + ".html", { waitUntil: "networkidle" });
    await p.pdf({ path: D + n + ".pdf", format: "A4", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  }
}
await b.close();
