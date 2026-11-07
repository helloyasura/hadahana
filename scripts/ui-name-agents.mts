import { chromium } from "playwright";
import { copyFileSync, mkdirSync } from "fs";

const OUT = "/opt/cursor/artifacts";
mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 1100 },
    recordVideo: { dir: OUT, size: { width: 1200, height: 900 } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  await page.goto("http://localhost:3456", { waitUntil: "networkidle" });
  await page.locator('input[type="date"]').fill("2021-11-11");
  await page.locator('input[type="time"]').fill("07:29");
  const castDone = page.waitForResponse((r) => r.url().includes("/api/cast") && r.ok());
  await page.getByRole("button", { name: /කේන්ද්‍රය සාදන්න|Cast Kendraya/ }).click();
  await castDone;
  await page.getByRole("button", { name: /Nam Thebima|නම් තැබීම/ }).click();
  await page.waitForSelector(".name-studio");
  await page.locator(".name-studio").scrollIntoViewIfNeeded();

  // religion + language selects
  await page.locator(".name-studio select").filter({ has: page.locator('option[value="buddhist"]') }).first().selectOption("buddhist");
  await page.locator(".name-studio select").filter({ has: page.locator('option[value="sinhala_language"]') }).first().selectOption("ensemble");

  await page.screenshot({ path: `${OUT}/name-agents-controls.png` });

  const namesDone = page.waitForResponse(
    (r) => r.url().includes("/api/names/suggest") && r.request().method() === "POST",
    { timeout: 120_000 },
  );
  await page.locator(".name-studio > button.primary").click();
  const res = await namesDone;
  const json = await res.json();
  await page.waitForSelector(".name-card");
  await page.waitForTimeout(600);
  await page.locator(".name-studio").screenshot({ path: `${OUT}/name-agents-ensemble.png` });
  console.log(JSON.stringify({
    ok: json.ok,
    agents: json.personalitiesUsed,
    usage: json.usageVerification,
    hasSinhalaLang: (json.personalitiesUsed ?? []).includes("sinhala_language"),
    hasLiterature: (json.personalitiesUsed ?? []).includes("sinhala_literature"),
    hasReligion: (json.personalitiesUsed ?? []).includes("multi_religion"),
    cards: await page.locator(".name-card").count(),
    verifiedBadges: await page.locator(".name-card.usage-verified").count(),
  }));
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) copyFileSync(await video.path(), `${OUT}/name-agents-demo.webm`);
}
main().catch((e) => { console.error(e); process.exit(1); });
