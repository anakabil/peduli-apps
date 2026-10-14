import { chromium } from "playwright";
const S = process.env.SHOTS || "/tmp/claude-0/-home-user-peduli-apps/e5dec931-7017-51d3-9f7e-0a1a68121378/scratchpad/shots";
const role = process.argv[2] || "pengawas";
const pages = (process.argv[3] || "/beranda").split(",");
const mobile = process.argv[4] === "mobile";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("console:", m.text().slice(0, 300)); });
page.on("response", (r) => { if (r.status() >= 500) console.log("HTTP", r.status(), r.url()); });
await page.goto("http://localhost:3000/masuk", { waitUntil: "networkidle" });
await page.getByText("Mode demo").click();
await page.locator(`button:has-text("${role.replace(/[0-9]/, "")}")`).nth(role.endsWith("2") ? 1 : 0).click();
await page.waitForURL(/beranda/, { timeout: 30000 });
for (const p of pages) {
  await page.goto("http://localhost:3000" + p, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const name = `${role}${p.replace(/[\/?=&]/g, "_")}${mobile ? "-m" : ""}.png`;
  await page.screenshot({ path: `${S}/${name}`, fullPage: true });
  console.log("saved", name, "title:", await page.title());
}
await browser.close();
