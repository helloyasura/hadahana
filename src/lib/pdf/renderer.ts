import { chromium, type Browser } from "playwright-core";
import { AccountError } from "../account/server";
import { pdfTimeBudgets } from "./timeouts";
// One Chromium at a time, no unbounded queue and no idle browser on the shared droplet.
let busy = false;
const waiting: { start: () => void; timer: ReturnType<typeof setTimeout> }[] = [];
async function acquireRender() {
  if (!busy) { busy = true; return; }
  if (waiting.length >= 2) throw new AccountError("The PDF renderer is busy. Please try again shortly.", 503);
  await new Promise<void>((resolve, reject) => {
    const entry = { start: resolve, timer: setTimeout(() => {
      const i = waiting.indexOf(entry); if (i >= 0) waiting.splice(i, 1);
      reject(new AccountError("PDF queue timed out. Please try again shortly.", 503));
    }, 12000) };
    waiting.push(entry);
  });
}
function releaseRender() {
  const next = waiting.shift();
  if (next) { clearTimeout(next.timer); next.start(); } else busy = false;
}
const attempts = new Map<string, { count: number; until: number }>();
export function admitPdf(user: string, now = Date.now()) {
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const entry = attempts.get(user) || { count: 0, until: now + 600000 };
  if (entry.count >= 8 || (!attempts.has(user) && attempts.size >= 5000)) throw new AccountError("PDF limit reached. Try again in 10 minutes.", 429);
  entry.count++; attempts.set(user, entry);
}
export async function renderPdf(html: string) {
  await acquireRender();
  const budgets = pdfTimeBudgets();
  let browser: Browser | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let expired = false;
  try {
    return await Promise.race([
      (async () => {
        browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser", headless: true, timeout: budgets.launchMs,
          args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=1", "--js-flags=--max-old-space-size=128", "--no-sandbox"] });
        if (expired) { await browser.close(); throw new Error("PDF timeout"); }
        const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block", offline: true });
        await context.route("**/*", route => route.abort()); // No HTTP, file://, metadata service or customer URLs.
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        await page.setContent(html, { waitUntil: "load", timeout: 12000 });
        await page.evaluate(() => document.fonts.ready);
        return await page.pdf({ preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true,
          headerTemplate: '<div></div>', footerTemplate: '<div style="font:9px sans-serif;color:#526779;width:100%;text-align:center">HADAHANA · <span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
      })(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { expired = true; void browser?.close(); reject(new AccountError("PDF generation timed out. Please try again.", 503)); }, budgets.renderMs); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    // Closing the browser closes every page/context, including failed jobs. Never reused between users.
    await browser?.close().catch(() => {});
    releaseRender();
  }
}
