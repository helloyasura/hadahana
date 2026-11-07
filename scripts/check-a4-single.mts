import { chromium } from "playwright";

const A4W = Math.floor((210 / 25.4) * 96);
const A4H = Math.floor(((297 - 20) / 25.4) * 96);

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: A4W, height: A4H } });
  await page.goto("http://localhost:3456", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "English" }).click();
  const castDone = page.waitForResponse(
    (r) => r.url().includes("/api/cast") && r.ok(),
  );
  await page.getByRole("button", { name: /^Cast Kendraya$/ }).click();
  await castDone;
  await page.waitForSelector("#kendraya-satahana");
  await page.evaluate(() => {
    document.documentElement.dataset.printMode = "single";
    document.documentElement.dataset.printPaper = "A4";
  });
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(500);
  const h = await page.evaluate(() =>
    Math.round(
      (
        document.querySelector("#kendraya-satahana") as HTMLElement
      ).getBoundingClientRect().height,
    ),
  );
  await page.screenshot({
    path: "/opt/cursor/artifacts/print-single-a4-width.png",
    fullPage: true,
  });
  console.log(
    JSON.stringify({
      A4W,
      A4H,
      contentHeight: h,
      fits: h <= A4H,
      overflowPx: h - A4H,
    }),
  );
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
