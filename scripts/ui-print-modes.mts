/**
 * Verify A4 print modes: controls visible + single-page fits A4 height.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

const BASE = process.env.HANDAHANA_URL || "http://localhost:3456";
const OUT = "/opt/cursor/artifacts";
mkdirSync(OUT, { recursive: true });

/** A4 portrait usable height at 96dpi with ~10mm margins */
const A4_USABLE_PX = Math.floor(((297 - 20) / 25.4) * 96); // ≈ 1045

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
    { timeout: 90_000 },
  );
  await page.getByRole("button", { name: /^Cast Kendraya$/ }).click();
  await castDone;
  await page.waitForSelector(".satahana, #kendraya-satahana", {
    timeout: 30_000,
  });
  await page.waitForSelector(".print-controls", { timeout: 15_000 });
  await page.screenshot({
    path: `${OUT}/print-controls-ui.png`,
    fullPage: false,
  });

  const modes = ["single", "standard", "book", "charts"] as const;
  const report: Record<string, unknown> = { a4UsablePx: A4_USABLE_PX };

  for (const mode of modes) {
    await page.locator(".print-controls select").nth(0).selectOption(mode);
    await page.locator(".print-controls select").nth(1).selectOption("A4");

    await page.evaluate((m) => {
      document.documentElement.dataset.printMode = m;
      document.documentElement.dataset.printPaper = "A4";
    }, mode);

    await page.emulateMedia({ media: "print" });
    await page.waitForTimeout(400);

    const metrics = await page.evaluate(() => {
      const art = document.querySelector("#kendraya-satahana") as HTMLElement;
      const sheets = [...document.querySelectorAll(".print-sheet")].map(
        (el) => {
          const style = window.getComputedStyle(el);
          return {
            className: el.className,
            display: style.display,
            height: Math.round((el as HTMLElement).getBoundingClientRect().height),
          };
        },
      );
      const rect = art?.getBoundingClientRect();
      return {
        height: Math.round(rect?.height ?? 0),
        width: Math.round(rect?.width ?? 0),
        sheets,
        title: document.querySelector(".satahana-title")?.textContent ?? "",
      };
    });

    await page.screenshot({
      path: `${OUT}/print-mode-${mode}.png`,
      fullPage: true,
    });

    await page.emulateMedia({ media: "screen" });
    await page.evaluate(() => {
      delete document.documentElement.dataset.printMode;
      delete document.documentElement.dataset.printPaper;
    });

    report[mode] = {
      ...metrics,
      fitsSingleA4:
        mode === "single" || mode === "charts"
          ? metrics.height <= A4_USABLE_PX * 1.08
          : null,
    };
  }

  writeFileSync(`${OUT}/print-modes-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  if (
    typeof (report.single as { fitsSingleA4?: boolean }).fitsSingleA4 ===
      "boolean" &&
    !(report.single as { fitsSingleA4: boolean }).fitsSingleA4
  ) {
    console.warn(
      "WARN: single mode taller than A4 usable area — may spill to page 2",
    );
  }

  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    const { copyFileSync } = await import("fs");
    copyFileSync(await video.path(), `${OUT}/print-modes-demo.webm`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
