import { chromium } from "playwright";
import fs from "fs";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/google-chrome-stable",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3456", { waitUntil: "networkidle" });
await page.waitForSelector(".brand");
await page.screenshot({ path: `${out}/handahana-hero-si.png`, fullPage: false });

await page.getByRole("button", { name: "English" }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/handahana-hero-en.png`, fullPage: false });

await page.getByRole("button", { name: "සිංහල" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /කේන්ද්‍රය සාදන්න|Cast Kendraya/ }).click();
await page.waitForSelector("table", { timeout: 30000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/handahana-kendraya.png`, fullPage: false });

await page.getByRole("button", { name: /නම් තැබීම|Nam Thebima/ }).click();
await page.waitForSelector(".primary-letter", { timeout: 10000 });
await page.screenshot({ path: `${out}/handahana-nam.png`, fullPage: false });

const namText = await page.locator(".primary-letter").innerText();
const brandSi = await page.locator(".brand").innerText();

await page
  .getByRole("navigation", { name: "Workspace tabs" })
  .getByRole("button", { name: /මුහුර්ත|Muhurta/ })
  .click();
const muhurtaPrimary = page.locator(".results button.primary");
if (await muhurtaPrimary.count()) {
  await muhurtaPrimary.first().click();
  await page.waitForTimeout(2000);
}
await page.screenshot({ path: `${out}/handahana-muhurta.png`, fullPage: false });

const rahuText = await page.locator(".results").innerText();
console.log(JSON.stringify({ brandSi, namText, rahuSnippet: rahuText.slice(0, 280) }, null, 2));
await browser.close();
