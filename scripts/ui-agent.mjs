import { chromium } from "playwright";
const out = "/opt/cursor/artifacts";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/google-chrome-stable",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3456", { waitUntil: "networkidle" });
await page.getByRole("navigation", { name: "Workspace tabs" }).getByRole("button", { name: /ආතුරුදය AI|Athurudaya AI/ }).click();
await page.waitForSelector(".agent-panel");
await page.getByRole("button", { name: /අධ්‍යාපනය|Studies/ }).click();
await page.locator(".agent-compose textarea").fill(
  "මේ දරුවාට ඉගෙනුම් ගැන කෙටි නිරීක්ෂණ 3ක් දෙන්න. ගණනය කරලා පමණයි.",
);
await page.locator('.agent-compose button[type="submit"]').click();
await page.waitForSelector(".agent-msg.assistant", { timeout: 120000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${out}/handahana-agent-chat.png`, fullPage: false });
const tools = await page.locator(".agent-tools").innerText().catch(() => "");
const reply = await page.locator(".agent-msg.assistant .agent-body").last().innerText();
console.log(JSON.stringify({ tools, replyPreview: reply.slice(0, 400) }, null, 2));
await browser.close();
