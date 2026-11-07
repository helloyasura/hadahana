import { chromium } from "playwright";
import { copyFileSync, mkdirSync } from "fs";

const OUT = "/opt/cursor/artifacts";
mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1100, height: 1400 },
    recordVideo: { dir: OUT, size: { width: 1100, height: 900 } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90_000);
  await page.goto("http://localhost:3456", { waitUntil: "networkidle" });
  // keep Sinhala for traditional booklet look
  await page.locator('input[type="date"]').fill("2021-11-11");
  await page.locator('input[type="time"]').fill("07:29");
  const castDone = page.waitForResponse((r) => r.url().includes("/api/cast") && r.ok());
  await page.getByRole("button", { name: /කේන්ද්‍රය සාදන්න|Cast Kendraya/ }).click();
  await castDone;
  await page.waitForSelector("#kendraya-satahana, .booklet-line");
  await page.waitForTimeout(800);
  await page.locator(".booklet-satahana, #kendraya-satahana").first().screenshot({
    path: `${OUT}/booklet-page-full.png`,
  });
  await page.locator(".print-sheet-cover").screenshot({
    path: `${OUT}/booklet-page1-ishta.png`,
  });
  await page.locator(".print-sheet-graha").screenshot({
    path: `${OUT}/booklet-page2-attrs.png`,
  });
  await page.locator(".print-sheet-dasha").screenshot({
    path: `${OUT}/booklet-page3-thrivara.png`,
  });
  await page.locator(".print-sheet-bhava").screenshot({
    path: `${OUT}/booklet-page4-graha-taththwaya.png`,
  });
  // print book mode preview
  await page.evaluate(() => {
    document.documentElement.dataset.printMode = "book";
    document.documentElement.dataset.printPaper = "A4";
  });
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/booklet-print-book-mode.png`, fullPage: true });
  console.log(JSON.stringify({
    lines: await page.locator(".booklet-line").count(),
    hasThrivara: (await page.locator("text=ත්‍රීවාර ලිඛිත").count()) > 0,
    hasGrahaT: (await page.locator("text=ග්‍රහ තත්වය").count()) > 0,
    hasIshta: (await page.locator("text=ශකරාජ").count()) > 0,
  }));
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) copyFileSync(await video.path(), `${OUT}/booklet-demo.webm`);
}
main().catch((e) => { console.error(e); process.exit(1); });
