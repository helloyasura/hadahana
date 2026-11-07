import { chromium } from "playwright";
import { copyFileSync, mkdirSync } from "fs";

const OUT = "/opt/cursor/artifacts";
mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 900, height: 1400 },
    recordVideo: { dir: OUT, size: { width: 900, height: 1100 } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90_000);
  await page.goto("http://localhost:3456", { waitUntil: "networkidle" });
  await page.locator('input[type="date"]').fill("2021-11-11");
  await page.locator('input[type="time"]').fill("07:29");
  const castDone = page.waitForResponse((r) => r.url().includes("/api/cast") && r.ok());
  await page.getByRole("button", { name: /කේන්ද්‍රය සාදන්න|Cast Kendraya/ }).click();
  await castDone;
  await page.waitForSelector(".booklet-charts-page .sl-grid");
  await page.waitForTimeout(600);

  const charts = page.locator(".booklet-charts-page");
  await charts.scrollIntoViewIfNeeded();
  await charts.screenshot({ path: `${OUT}/booklet-charts-diagonal.png` });

  const grids = page.locator(".sl-grid");
  console.log(JSON.stringify({
    grids: await grids.count(),
    corners: await page.locator(".sl-corner").count(),
    diags: await page.locator(".sl-diag").count(),
    centerTitles: await page.locator(".sl-center strong").allTextContents(),
    sampleGlyphs: await page.locator(".booklet-charts-page .sl-glyphs span").allTextContents(),
    sampleNums: await page.locator(".booklet-charts-page .sl-num").allTextContents(),
    hasNote: (await page.locator("text=නවාංශකය වෙනස් කර").count()) > 0,
    h1Glyph: await page.locator(".booklet-charts-page .sl-grid").first().locator(".sl-edge").first().innerText(),
    emptyNums: await page.locator(".booklet-charts-page .sl-grid").first().locator(".sl-num").allTextContents(),
  }));

  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    const p = await video.path();
    copyFileSync(p, `${OUT}/booklet-charts-demo.webm`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
