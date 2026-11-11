/** Synthetic-only end-to-end harness. Never contacts LUMS, sends email or seeds a prod bypass. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const { chromium } = await import(
  process.env.PRO_PLAYWRIGHT_MODULE || "playwright-core"
);
const dir = await mkdtemp(path.join(tmpdir(), "pro-flow-"));
const origin = "http://127.0.0.1:4183",
  base = "/hadahana",
  api = `${origin}${base}/pro/api`;
const challenges = new Map(),
  expired = new Set(),
  subjects = new Map();
const subjectFor = (email) => {
  if (!subjects.has(email)) subjects.set(email, randomUUID());
  return subjects.get(email);
};
const mock = createServer(async (req, res) => {
  let raw = "";
  for await (const part of req) raw += part;
  const body = JSON.parse(raw || "{}");
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/jyotisha-pro/auth/start") {
    const id = randomBytes(32).toString("hex");
    challenges.set(id, body.email);
    res.end(JSON.stringify({ challengeId: id }));
  } else if (req.url === "/jyotisha-pro/auth/verify") {
    const email = challenges.get(body.challengeId);
    if (!email || body.code !== "123456") {
      res.statusCode = 401;
      res.end("{}");
      return;
    }
    challenges.delete(body.challengeId);
    res.end(
      JSON.stringify({
        audience: "JYOTISHA_PRO",
        verified: true,
        email,
        subject: subjectFor(email),
      }),
    );
  } else if (req.url === "/jyotisha-pro/entitlement") {
    res.end(
      JSON.stringify({
        product: "JYOTISHA_PRO",
        active: !expired.has(body.subject),
        expiresAt: new Date(Date.now() + 20 * 86400000).toISOString(),
        kind: "trial",
      }),
    );
  } else {
    res.statusCode = 404;
    res.end("{}");
  }
});
await new Promise((r) => mock.listen(0, "127.0.0.1", r));
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--webpack",
    "-p",
    "4183",
    "-H",
    "127.0.0.1",
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "development",
      NEXT_PUBLIC_BASE_PATH: base,
      PRO_STORAGE_KEY: randomBytes(32).toString("hex"),
      PRO_DATA_PATH: path.join(dir, "data.enc"),
      PRO_PUBLIC_ORIGIN: origin,
      PRO_LUMS_API_URL: `http://127.0.0.1:${mock.address().port}`,
      PRO_LUMS_SERVICE_KEY:
        "synthetic-harness-service-key-at-least-32-characters",
      NEXT_PUBLIC_POSTHOG_KEY: "",
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
app.stdout.on("data", (c) => (logs += c));
app.stderr.on("data", (c) => (logs += c));
let browser;
const check = async (res, status) => {
  assert.equal(res.status(), status, await res.text());
  return res.json();
};
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${origin}${base}/pro/login`);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, "Next dev did not start");
  browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext(),
    other = await browser.newContext();
  const headers = { Origin: origin, "x-jyotisha-pro": "1" };
  const post = (ctx, route, data) =>
    ctx.request.post(`${api}${route}`, { data, headers });
  await check(await context.request.get(`${api}/workspace`), 401);
  await context.addCookies([
    {
      name: "hadahana_session",
      value: "synthetic-consumer-cookie",
      domain: "127.0.0.1",
      path: "/hadahana",
    },
  ]);
  await check(await context.request.get(`${api}/workspace`), 401);
  await check(
    await context.request.post(`${api}/auth`, { data: { action: "logout" } }),
    403,
  );
  async function register(ctx, email, displayName) {
    await check(
      await post(ctx, "/auth", {
        action: "start",
        email,
        displayName,
        intent: "register",
      }),
      200,
    );
    await check(
      await post(ctx, "/auth", { action: "verify", code: "999999" }),
      401,
    );
    await check(
      await post(ctx, "/auth", { action: "verify", code: "123456" }),
      200,
    );
  }
  await register(context, "pilot-a@example.test", "නවෝද · ආදර්ශ ජෝතිෂ්‍යවේදී");
  await register(other, "pilot-b@example.test", "දෙවන ආදර්ශ ගිණුම");

  const workspace = await check(
    await context.request.get(`${api}/workspace`),
    200,
  );
  const defaults = workspace.presets[0].config;
  assert.equal(workspace.studio.version, 1);
  const synthetic = {
    date: "2000-01-01",
    time: "12:00",
    latitude: 6.9271,
    longitude: 79.8612,
    timezone: "Asia/Colombo",
  };
  const anon = await browser.newContext();
  await check(
    await post(anon, "/studio", { input: synthetic, config: defaults }),
    401,
  );
  const anonymousPage = await anon.newPage();
  await anonymousPage.goto(`${origin}${base}/pro/studio`);
  assert.ok(
    anonymousPage.url().endsWith("/hadahana/pro/login"),
    anonymousPage.url(),
  );
  await check(
    await context.request.post(`${api}/studio`, {
      data: { input: synthetic, config: defaults },
    }),
    403,
  );
  await check(
    await post(context, "/studio", {
      input: { ...synthetic, date: "2000-02-31" },
      config: defaults,
    }),
    400,
  );
  await check(
    await post(context, "/studio", {
      input: { ...synthetic, timezone: "Bad/Timezone" },
      config: defaults,
    }),
    400,
  );
  await check(
    await post(anon, "/transits", {
      action: "sky",
      instant: "2000-01-01T00:00:00Z",
      config: defaults,
    }),
    401,
  );
  await check(
    await post(context, "/transits", {
      action: "ingress",
      from: "2000-01-01T00:00:00Z",
      to: "2002-01-01T00:00:00Z",
      planet: "Sun",
      target: 9,
      config: defaults,
    }),
    400,
  );
  const calculated = await check(
    await post(context, "/studio", { input: synthetic, config: defaults }),
    200,
  );
  assert.equal(calculated.result.navagraha.length, 9);
  await check(
    await post(context, "/workspace", {
      action: "studio",
      settings: {
        ...workspace.studio,
        notes: "Synthetic manual rule",
        houses: "equal",
      },
    }),
    200,
  );
  const saved = await check(await context.request.get(`${api}/workspace`), 200);
  assert.equal(saved.studio.notes, "Synthetic manual rule");
  assert.equal(
    (await check(await other.request.get(`${api}/workspace`), 200)).studio
      .notes,
    "",
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${origin}${base}/pro/studio`);
  await page.locator(".studio-wheel").waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector(".studio-canvas")?.getAttribute("aria-busy") ===
      "false",
  );
  assert.equal(await page.locator(".studio-planet").count(), 10);
  assert.equal(await page.locator(".studio-nak-label").count(), 27);
  assert.equal(
    await page
      .locator(".studio-worksheet:not(.studio-dasha-browser) tbody tr")
      .count(),
    10,
  );
  await page.getByRole("button", { name: /Live/ }).click();
  await page.getByLabel("දිනය / Date", { exact: true }).fill("2000-01-01");
  await page.getByLabel("වේලාව / Time", { exact: true }).fill("12:00");
  await page.getByLabel("අයනාංශය", { exact: true }).selectOption("raman");
  await page.getByLabel("රාහු / කේතු", { exact: true }).selectOption("true");
  await page
    .getByLabel("භාව ක්‍රමය", { exact: true })
    .selectOption("whole-sign");
  await page.waitForFunction(
    () =>
      document.querySelector(".studio-canvas")?.getAttribute("aria-busy") ===
      "false",
  );
  await page
    .getByRole("button", { name: "සැකසුම් සුරකින්න", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "පැතිකඩට සැකසුම් සුරැකුණි." })
    .waitFor();
  await page.reload();
  await page.locator(".studio-wheel").waitFor();
  assert.equal(
    await page.getByLabel("අයනාංශය", { exact: true }).inputValue(),
    "raman",
  );
  assert.equal(
    await page.getByLabel("රාහු / කේතු", { exact: true }).inputValue(),
    "true",
  );
  await page.getByRole("button", { name: /Live/ }).click();
  await page.getByLabel("දිනය / Date", { exact: true }).fill("2000-01-01");
  await page.getByLabel("වේලාව / Time", { exact: true }).fill("12:00");
  await page.getByText("සුරැකි ක්‍රම / Presets", { exact: false }).click();
  await page
    .getByLabel("නව අනුවාදයේ නම", { exact: true })
    .fill("Synthetic studio method");
  await page
    .getByRole("button", { name: "නව ක්‍රම අනුවාදය සුරකින්න", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "නව ක්‍රම අනුවාදය සුරැකුණි." })
    .waitFor();
  const after = await check(await context.request.get(`${api}/workspace`), 200);
  assert.equal(
    after.presets.find((p) => p.name === "Synthetic studio method").studio
      .calculation.ayanamsa,
    "raman",
  );
  const studioPreset = after.presets.find(
    (p) => p.name === "Synthetic studio method",
  );
  const publicLink = await check(
    await post(context, "/workspace", {
      action: "link",
      presetId: studioPreset.id,
      label: "Synthetic privacy",
      days: 1,
      maxUses: 1,
    }),
    200,
  );
  const publicMetadata = await check(
    await anon.request.get(`${api}/public/${publicLink.token}`),
    200,
  );
  assert.equal(publicMetadata.preset.studio, undefined);
  assert.ok(!JSON.stringify(publicMetadata).includes("Synthetic manual rule"));
  const shots = process.env.PRO_SCREENSHOTS_DIR || "/workspace/artifacts";
  await mkdir(shots, { recursive: true });
  for (const [width, label] of [
    [1440, "desktop"],
    [390, "mobile"],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    await page
      .getByLabel("Divisional chart", { exact: true })
      .selectOption("1");
    await page
      .getByRole("button", { name: "◎ රාශි චක්‍රය", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector(".studio-canvas")?.getAttribute("aria-busy") ===
        "false",
    );
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: "nextjs-portal{display:none!important}",
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow ${width}`,
    );
    await page.screenshot({
      path: path.join(shots, `pro-studio-${label}.png`),
      fullPage: true,
      animations: "disabled",
    });
    await page
      .getByLabel("Divisional chart", { exact: true })
      .selectOption("9");
    await page
      .getByRole("button", { name: "▧ සිංහල කේන්ද්‍රය", exact: true })
      .click();
    await page.locator(".studio-chart-stage .sl-chart").waitFor();
    await page.screenshot({
      path: path.join(shots, `pro-studio-square-${label}.png`),
      fullPage: true,
      animations: "disabled",
    });
    await page.keyboard.press("Control+k");
    await page.getByRole("dialog").waitFor();
    await page
      .getByPlaceholder("උදා: Saturn / සෙනසුරු / Ashwini / wealth")
      .fill("Saturn");
    assert.ok((await page.locator(".studio-ref-results article").count()) >= 1);
    await page.screenshot({
      path: path.join(shots, `pro-studio-reference-${label}.png`),
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    await page.getByLabel("Dasha date jump").fill("2001-01-01");
    assert.equal(
      await page
        .locator(".studio-dasha-browser tbody .studio-row-selected")
        .count(),
      1,
    );
    await page
      .locator(".studio-dasha-browser")
      .screenshot({ path: path.join(shots, `pro-v2-dasha-${label}.png`) });
  }
  await page
    .getByRole("button", { name: "◎ රාශි චක්‍රය", exact: true })
    .click();
  await page.getByLabel("Divisional chart", { exact: true }).selectOption("1");
  await page.waitForFunction(
    () =>
      document.querySelector(".studio-canvas")?.getAttribute("aria-busy") ===
      "false",
  );
  await page
    .getByRole("button", { name: "මෙම සටහන ජන්ම ලෙස රඳවන්න", exact: true })
    .click();
  await page.getByLabel("Transit UTC instant").fill("2000-02-01T06:30");
  await page
    .getByRole("button", { name: "ගෝචරය පෙන්වන්න", exact: true })
    .click();
  await page.locator(".studio-transit-marker").first().waitFor();
  assert.equal(await page.locator(".studio-transit-marker").count(), 9);
  for (const [width, label] of [
    [1440, "desktop"],
    [390, "mobile"],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    await page
      .locator(".studio-canvas")
      .screenshot({ path: path.join(shots, `pro-v2-transits-${label}.png`) });
    await page
      .locator(".studio-transit-desk")
      .screenshot({ path: path.join(shots, `pro-v2-ingress-${label}.png`) });
  }
  await page
    .getByRole("button", { name: "ගෝචර ආවරණය ඉවත් කරන්න", exact: true })
    .click();
  await page.getByLabel("නැකත් 27 / පාද 108", { exact: true }).uncheck();
  assert.equal(await page.locator(".studio-nak-label").count(), 0);
  await page.getByLabel("Sun", { exact: true }).uncheck();
  assert.equal(await page.locator(".studio-planet").count(), 9);
  await page.getByLabel("Time offset in hours").fill("24");
  await page.getByRole("button", { name: "▷ කාල චලනය", exact: true }).click();
  await page.waitForFunction(
    () =>
      Number(
        document.querySelector('input[aria-label="Time offset in hours"]')
          .value,
      ) > 24,
    {},
    { timeout: 10000 },
  );
  await page.getByRole("button", { name: "Ⅱ නවත්වන්න", exact: true }).click();
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: path.join(shots, "pro-studio-worksheet.pdf"),
    format: "A4",
    printBackground: true,
  });
  assert.deepEqual(errors, []);
  await check(
    await post(anon, "/tools", { action: "panchanga", input: synthetic }),
    401,
  );
  await check(
    await post(context, "/tools", {
      action: "nakath",
      birth: synthetic,
      fromDate: "2000-01-01",
      toDate: "2000-03-01",
      eventId: "naming",
    }),
    400,
  );
  await page.emulateMedia({ media: "screen" });
  await page.goto(`${origin}${base}/pro/tools`);
  await page
    .getByRole("button", { name: "ගණනය කරන්න / Calculate", exact: true })
    .click();
  await page.locator(".pro-tool-result").waitFor();
  assert.ok(
    (await page.locator(".pro-tool-result").innerText()).includes(
      "Asia/Colombo",
    ),
  );
  for (const [tab, label] of [
    ["පංචාංගය", "panchanga"],
    ["පොරොන්දම්", "matching"],
    ["නැකත් දින සොයන්න", "nakath"],
  ]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await page
      .getByRole("button", { name: "ගණනය කරන්න / Calculate", exact: true })
      .click();
    await page.locator(".pro-tool-result").waitFor();
    for (const [width, size] of [
      [1440, "desktop"],
      [390, "mobile"],
    ]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: path.join(shots, `pro-v2-${label}-${size}.png`),
        fullPage: true,
      });
    }
  }
  expired.add(subjectFor("pilot-a@example.test"));
  await check(
    await post(context, "/studio", { input: synthetic, config: defaults }),
    402,
  );
  console.log(
    "Studio E2E passed: protected page/API, CSRF, date/zone validation, licence fail-closed, tenant isolation, profile persistence, named presets, wheel/square/D9, controls, Ctrl+K, playback, desktop/mobile and PDF exports.",
  );
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  await browser?.close();
  app.kill("SIGTERM");
  await new Promise((r) => mock.close(r));
  await rm(dir, { recursive: true, force: true });
}
