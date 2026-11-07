/**
 * UI: chart first+middle names + manual letter mode.
 */
import { chromium } from "playwright";
import { copyFileSync, mkdirSync } from "fs";

const BASE = process.env.HANDAHANA_URL || "http://localhost:3456";
const OUT = "/opt/cursor/artifacts";
mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 900 } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "English" }).click();

  const castDone = page.waitForResponse(
    (r) => r.url().includes("/api/cast") && r.ok(),
  );
  await page.getByRole("button", { name: /^Cast Kendraya$/ }).click();
  await castDone;
  await page.getByRole("button", { name: /Nam Thebima|නම් තැබීම/ }).click();
  await page.waitForSelector(".name-source-tabs");
  await page.locator(".name-studio").scrollIntoViewIfNeeded();

  // Chart mode generate
  await page.locator(".name-source-tabs button").nth(0).click();
  const suggest1 = page.waitForResponse(
    (r) =>
      r.url().includes("/api/names/suggest") && r.request().method() === "POST",
    { timeout: 120_000 },
  );
  await page.locator(".name-studio > button.primary").click();
  const res1 = await suggest1;
  const json1 = await res1.json();
  await page.waitForSelector(".name-card");
  await page.screenshot({
    path: `${OUT}/name-pairs-chart.png`,
    fullPage: true,
  });

  // Manual mode
  await page.locator(".name-source-tabs button").nth(1).click();
  await page.locator(".name-manual-letters input").nth(0).fill("මො, ර");
  await page.locator(".name-manual-letters input").nth(1).fill("ස, ක");
  await page.screenshot({
    path: `${OUT}/name-manual-letters-ui.png`,
    fullPage: false,
  });
  const suggest2 = page.waitForResponse(
    (r) =>
      r.url().includes("/api/names/suggest") && r.request().method() === "POST",
    { timeout: 120_000 },
  );
  await page.locator(".name-studio > button.primary").click();
  const res2 = await suggest2;
  const json2 = await res2.json();
  await page.waitForSelector(".name-card");
  await page.locator(".name-card footer button").first().click();
  await page.waitForSelector(".name-picked");
  await page.screenshot({
    path: `${OUT}/name-pairs-manual-picked.png`,
    fullPage: true,
  });

  const summary = {
    chartOk: json1.ok && json1.names?.[0]?.first && json1.names?.[0]?.middle,
    chartSample: json1.names?.[0]?.roman,
    chartCount: json1.names?.length,
    manualOk:
      json2.ok &&
      json2.letterSource === "manual" &&
      json2.names?.[0]?.first &&
      json2.names?.[0]?.middle,
    manualSample: json2.names?.[0]?.roman,
    manualCount: json2.names?.length,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.chartOk || !summary.manualOk) {
    throw new Error("name pair UI verification failed");
  }

  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    copyFileSync(await video.path(), `${OUT}/name-pairs-demo.webm`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
