/** Isolated, credential-free Chromium regression test for the /hadahana UI. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.UI_BASE_URL || "http://127.0.0.1:3456/hadahana";
const out = process.env.UI_SHOTS_DIR || "/workspace/hadahana-redesign-shots";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const report = [];
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 1280 ? 900 : 844 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.url().startsWith(base) && response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    const tab = (name) =>
      page
        .getByRole("navigation", { name: "Workspace tabs" })
        .getByRole("button", { name, exact: true });
    const capture = async (name, selector) => {
      if (selector)
        await page
          .locator(selector)
          .first()
          .evaluate((node) =>
            node.scrollIntoView({ block: "start", behavior: "instant" }),
          );
      await page.waitForTimeout(650);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `${width}: horizontal overflow at ${name}`,
      );
      await page.screenshot({ path: path.join(out, `${width}-${name}.png`) });
    };
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForTimeout(1100);
    assert.equal(await page.locator("html").getAttribute("lang"), "si");
    await capture("hero-si");
    // Visit all reveal targets before a full page shot (no hidden off-screen panels).
    for (const selector of [".birth-panel", ".features", ".tabs"])
      await page.locator(selector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(out, `${width}-home-full.png`),
      fullPage: true,
    });
    assert.equal(await page.locator(".features li").count(), 14);
    await page.getByRole("button", { name: "English", exact: true }).click();
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    await capture("birth-en", ".birth-panel");
    await page
      .getByRole("button", { name: "Pause motion", exact: true })
      .click();
    assert.equal(
      await page.locator(".workspace").getAttribute("data-motion"),
      "paused",
    );
    assert.equal(
      await page
        .locator(".zodiac-ring")
        .evaluate((node) => getComputedStyle(node).animationPlayState),
      "paused",
    );
    await page
      .getByRole("button", { name: "Resume motion", exact: true })
      .click();
    await page.locator(".birth-panel .grid-form input").first().fill("UI Test");
    await page.locator(".birth-panel button.primary").click();
    await page.waitForSelector(".satahana", { timeout: 30000 });
    assert.equal(
      await page.locator(".results").getAttribute("aria-busy"),
      "false",
    );
    await capture("chart", ".satahana-host");
    assert.equal(
      await page
        .locator(".satahana")
        .evaluate((node) => getComputedStyle(node).color),
      "rgb(17, 17, 17)",
    );
    await tab("Nam Thebima").click();
    await page.locator(".name-studio button.primary").click();
    await page.waitForSelector(".name-card", { timeout: 30000 });
    assert.ok((await page.locator(".name-card").count()) >= 12);
    await capture("names", ".name-cards");
    await page.locator(".name-card footer button").first().click();
    assert.ok(await page.locator(".name-picked").isVisible());
    await capture("name-studio", ".name-studio");
    await tab("Palapala").click();
    assert.equal(await page.locator(".bhava-grid article").count(), 12);
    await capture("palapala", ".bhava-grid");
    await tab("Porondam").click();
    await page.locator(".results button.primary").click();
    await page.waitForSelector(".score", { timeout: 30000 });
    await capture("porondam", ".results");
    await tab("Muhurta / Nakath").click();
    await page.locator(".nakath-finder button.primary").click();
    await page.waitForSelector(".nakath-date-row", { timeout: 30000 });
    await capture("nakath", ".nakath-finder");
    await tab("Panchanga").click();
    await page.locator(".results button.primary").click();
    await page.waitForSelector(".json-block", { timeout: 30000 });
    await tab("Dosha / Yoga").click();
    assert.match(await page.locator(".results").innerText(), /Kuja/);
    await tab("Athurudaya AI").click();
    assert.ok(await page.locator(".agent-compose textarea").isVisible());
    await capture("agent", ".agent-panel");
    await tab("Export").click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /JSON/ }).click();
    assert.match((await download).suggestedFilename(), /^handahana-.*\.json$/);
    await capture("export", ".results");
    await tab("Kendraya").click();
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator(".studio-nav").isVisible(), false);
    assert.equal(await page.locator(".hero").isVisible(), false);
    assert.equal(await page.locator(".satahana").isVisible(), true);
    await page.emulateMedia({ media: "screen", reducedMotion: "reduce" });
    assert.equal(
      await page
        .locator(".zodiac-ring")
        .evaluate((node) => getComputedStyle(node).animationName),
      "none",
    );
    assert.deepEqual(errors, [], `${width}: browser errors`);
    report.push({
      width,
      allNineTabs: "pass",
      casting: "pass",
      namingAndSelection: "pass",
      compatibility: "pass",
      nakathScan: "pass",
      panchanga: "pass",
      jsonDownload: "pass",
      print: "pass",
      motionControls: "pass",
      overflow: "none",
      browserErrors: errors,
    });
    await page.close();
  }
  // Keyboard path and no-JS progressive enhancement on a fresh page.
  const keyboardPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await keyboardPage.goto(base, { waitUntil: "networkidle" });
  await keyboardPage.keyboard.press("Tab");
  assert.equal(
    await keyboardPage
      .locator(".skip-link")
      .evaluate((node) => node === document.activeElement),
    true,
  );
  await keyboardPage.keyboard.press("Enter");
  assert.match(keyboardPage.url(), /#birth-details$/);
  await keyboardPage.close();
  const noJs = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await noJs.goto(base, { waitUntil: "load" });
  assert.equal(
    await noJs
      .locator(".features")
      .evaluate((node) => getComputedStyle(node).opacity),
    "1",
  );
  assert.equal(await noJs.locator(".features li").count(), 14);
  await noJs.close();
  await fs.writeFile(
    path.join(out, "test-results.json"),
    JSON.stringify(
      { report, keyboardSkipLink: "pass", noJsContent: "pass" },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        report,
        keyboardSkipLink: "pass",
        noJsContent: "pass",
        screenshots: out,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
