/**
 * Playwright walkthrough: cast → Nam tab → Name Studio generate → pick.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

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
  await page.screenshot({ path: `${OUT}/name-studio-hero.png`, fullPage: false });

  const castDone = page.waitForResponse(
    (r) => r.url().includes("/api/cast") && r.ok(),
    { timeout: 90_000 },
  );
  await page.getByRole("button", { name: /^Cast Kendraya$|^කේන්ද්‍රය සාදන්න$/ }).click();
  await castDone;
  await page.waitForSelector(".satahana-host, .kendraya-satahana, [class*='satahana']", {
    timeout: 30_000,
  });
  await page.getByRole("button", { name: /Nam Thebima|නම් තැබීම/ }).click();
  await page.waitForSelector(".primary-letter", { timeout: 30_000 });
  await page.waitForSelector(".name-studio", { timeout: 30_000 });
  await page.screenshot({ path: `${OUT}/name-studio-tab.png`, fullPage: true });

  await page.locator(".name-studio select").nth(0).selectOption("au");
  await page.locator(".name-studio select").nth(1).selectOption("ensemble");
  await page.getByPlaceholder(/e\.g\. kind|උදා: දයාවත්/).fill(
    "kind · studious · easy name abroad",
  );
  await page
    .getByRole("button", { name: /Generate ~20 names|නම් ~20ක් ජනනය/ })
    .click();
  await page.waitForSelector(".name-card", { timeout: 120_000 });
  await page.screenshot({ path: `${OUT}/name-studio-results-au.png`, fullPage: true });

  await page.locator(".name-card footer button").first().click();
  await page.waitForSelector(".name-picked");
  await page.screenshot({ path: `${OUT}/name-studio-picked.png`, fullPage: false });

  const cards = await page.locator(".name-card").count();
  const picked = await page.locator(".picked-main").innerText();
  console.log(JSON.stringify({ cards, picked, ok: cards >= 12 }));
  if (cards < 12) throw new Error(`expected >=12 cards, got ${cards}`);

  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    const vpath = await video.path();
    const { copyFileSync } = await import("fs");
    copyFileSync(vpath, `${OUT}/name-studio-demo.webm`);
    console.log("video", `${OUT}/name-studio-demo.webm`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
