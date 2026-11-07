import { chromium } from "playwright";
const out = "/opt/cursor/artifacts";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/google-chrome-stable",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
await page.goto("http://localhost:3456", { waitUntil: "networkidle" });
await page.waitForSelector(".place-fields");
await page.locator(".place-search input").fill("jaffna");
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/handahana-places-search.png` });
const countText = await page.locator(".place-count").first().innerText();
await page.locator(".place-custom-toggle input").check();
await page.locator(".place-coords input").nth(0).fill("6.9344");
await page.locator(".place-coords input").nth(1).fill("79.8428");
await page.getByPlaceholder(/රෝහල් ලිපිනය|Hospital address/).fill("Colombo Fort custom");
await page.screenshot({ path: `${out}/handahana-places-custom-coords.png` });
console.log(JSON.stringify({ countText }, null, 2));
await browser.close();
