import { chromium } from "playwright";
import fs from "fs";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/google-chrome-stable",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
await page.goto("http://localhost:3456", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /කේන්ද්‍රය සාදන්න|Cast Kendraya/ }).click();
await page.waitForSelector(".satahana-title", { timeout: 45000 });
await page.waitForTimeout(800);
await page.locator(".satahana").screenshot({
  path: `${out}/handahana-satahana-report.png`,
});
await page.screenshot({
  path: `${out}/handahana-satahana-page.png`,
  fullPage: true,
});
const title = await page.locator(".satahana-title").innerText();
const lagna = await page.locator(".si-center strong").first().innerText();
console.log(JSON.stringify({ title, lagna }, null, 2));
await browser.close();
