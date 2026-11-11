/** Synthetic-only end-to-end harness. Never contacts LUMS, sends email or seeds a prod bypass. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, execFileSync } from "node:child_process";
import sharp from "sharp";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const { chromium } = await import(
  process.env.PRO_PLAYWRIGHT_MODULE || "playwright-core"
);
const dir = await mkdtemp(path.join(tmpdir(), "pro-flow-"));
const origin = "http://127.0.0.1:4184",
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
    "4184",
    "-H",
    "127.0.0.1",
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "development",
      NEXT_PUBLIC_BASE_PATH: base,
      CHROMIUM_PATH: "/usr/bin/google-chrome",
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
  await check(await anon.request.get(`${api}/cases`), 401);
  const anonPage = await anon.newPage();
  await anonPage.goto(`${origin}${base}/pro/cases`);
  assert.ok(anonPage.url().endsWith("/hadahana/pro/login"));
  await check(
    await context.request.post(`${api}/cases`, {
      data: { action: "service", name: "No origin", kind: "reading" },
    }),
    403,
  );
  const link = await check(
    await post(context, "/workspace", {
      action: "link",
      presetId: workspace.presets[0].id,
      label: "Synthetic case intake",
      days: 7,
      maxUses: 10,
    }),
    200,
  );
  const image = await sharp({
    create: { width: 800, height: 1000, channels: 3, background: "#fff8df" },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="800" height="1000"><rect x="80" y="170" width="640" height="640" fill="none" stroke="#715d3a" stroke-width="6"/><path d="M80 330H720M80 650H720M240 170V810M560 170V810" stroke="#715d3a" stroke-width="3"/><text x="180" y="100" font-size="32">SYNTHETIC BIRTH RECORD</text><text x="280" y="480" font-size="30">Lagna / Dasha</text></svg>',
        ),
      },
    ])
    .withExif({ IFD0: { Artist: "Synthetic EXIF to strip" } })
    .jpeg()
    .toBuffer();
  const upload = {
    mime: "image/jpeg",
    data: image.toString("base64"),
    consent: true,
  };
  await check(
    await post(anon, `/public/${link.token}`, { ...synthetic, consent: false }),
    400,
  );
  await check(
    await post(anon, `/public/${link.token}`, {
      ...synthetic,
      consent: true,
      document: { ...upload, consent: false },
    }),
    400,
  );
  await check(
    await post(anon, `/public/${link.token}`, {
      ...synthetic,
      consent: true,
      document: { ...upload, mime: "application/pdf" },
    }),
    400,
  );
  const submitted = await check(
    await post(anon, `/public/${link.token}`, {
      ...synthetic,
      consent: true,
      question: "Career investigation synthetic case",
      timeUnsure: true,
      placeLabel: "Colombo (synthetic)",
      document: upload,
    }),
    200,
  );
  assert.ok(submitted.result);
  const inbox = await check(await context.request.get(`${api}/cases`), 200);
  assert.equal(inbox.clients.length, 1);
  assert.equal(inbox.clients[0].source, "incoming");
  assert.equal(inbox.clients[0].status, "new");
  const id = inbox.clients[0].id;
  let current = (
    await check(await context.request.get(`${api}/cases?id=${id}`), 200)
  ).client;
  assert.equal(current.case.timeUnsure, true);
  assert.equal(current.case.document.pages.length, 1);
  assert.equal(
    (
      await sharp(
        Buffer.from(current.case.document.pages[0], "base64"),
      ).metadata()
    ).exif,
    undefined,
  );
  await check(await other.request.get(`${api}/cases?id=${id}`), 404);
  await check(
    await post(other, "/cases", {
      action: "pin",
      id,
      revision: 0,
      title: "Cross owner",
      text: "Denied",
      state: current.case.state,
    }),
    404,
  );
  await check(
    await post(other, "/cases/document", { id, revision: 0, upload }),
    404,
  );
  await check(
    await post(anon, "/cases/pdf", {
      id,
      reportId: randomUUID(),
      issue: false,
    }),
    401,
  );
  const change = async (payload) => {
    const r = await check(
      await post(context, "/cases", {
        id,
        revision: current.case.revision,
        ...payload,
      }),
      200,
    );
    current = r.client;
    return current;
  };
  const details = {
    action: "update",
    status: "in_progress",
    claim: true,
    serviceId: "reading",
    question: "Career investigation synthetic case",
    notes: "SYNTHETIC PRIVATE CASE NOTE",
    checked: ["verify", "method"],
  };
  await check(
    await post(context, "/cases", {
      ...details,
      status: "completed",
      id,
      revision: current.case.revision,
    }),
    409,
  );
  await change(details);
  assert.equal(current.case.assignedTo, inbox.ownerId);
  await check(
    await post(context, "/cases", { ...details, id, revision: 0 }),
    409,
  );
  const state = structuredClone(current.case.state);
  state.settings.division = 9;
  state.dasha = { maha: 1, bhukti: 2, date: "2001-01-01" };
  state.consultation = {
    tab: "match",
    a: synthetic,
    b: { ...synthetic, date: "2001-02-02" },
    from: "2026-11-11",
    to: "2026-11-12",
    event: "naming",
  };
  await change({ action: "state", state });
  await change({
    action: "pin",
    title: "සාක්ෂි / Career evidence",
    text: "Manual evidence with limitations. <script>must remain text</script>",
    state,
  });
  await change({
    action: "report",
    title: "සේවාලාභී වාර්තාව",
    body: "Reviewed traditional guidance. No guaranteed predictions.",
    language: "si",
    stage: "draft",
    reviewed: false,
  });
  await check(
    await post(context, "/cases", {
      action: "report",
      id,
      revision: current.case.revision,
      title: "Unreviewed final",
      body: "Not allowed",
      language: "en",
      stage: "final",
      reviewed: false,
    }),
    400,
  );
  await change({
    action: "report",
    title: "සේවාලාභී වාර්තාව",
    body: "Reviewed traditional guidance. No guaranteed predictions.",
    language: "si",
    stage: "final",
    reviewed: true,
  });
  const final = current.case.reports.at(-1);
  await check(
    await post(other, "/cases/pdf", { id, reportId: final.id, issue: true }),
    404,
  );
  const pdfResponse = await post(context, "/cases/pdf", {
    id,
    reportId: final.id,
    issue: true,
  });
  assert.equal(
    pdfResponse.status(),
    200,
    pdfResponse.status() === 200 ? "" : await pdfResponse.text(),
  );
  const pdf = await pdfResponse.body();
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  const shots = process.env.PRO_CASES_SHOTS_DIR || "/workspace/artifacts";
  await mkdir(shots, { recursive: true });
  const pdfPath = path.join(shots, "pro-cases-final-report.pdf");
  await writeFile(pdfPath, pdf);
  assert.match(
    execFileSync("pdffonts", [pdfPath], { encoding: "utf8" }),
    /NotoSansSinhala/,
  );
  const text = execFileSync("pdftotext", [pdfPath, "-"], { encoding: "utf8" });
  assert.ok(!text.includes("SYNTHETIC PRIVATE CASE NOTE"));
  assert.ok(text.includes("Reviewed traditional guidance"));
  current = (
    await check(await context.request.get(`${api}/cases?id=${id}`), 200)
  ).client;
  assert.ok(current.case.reports.at(-1).issuedAt);
  await change({ ...details, status: "completed" });
  const pdfUpload = {
    mime: "application/pdf",
    data: pdf.toString("base64"),
    consent: true,
  };
  await check(
    await post(anon, `/public/${link.token}`, {
      ...synthetic,
      consent: true,
      question: "PDF document case",
      document: pdfUpload,
    }),
    200,
  );
  const pdfCases = await check(await context.request.get(`${api}/cases`), 200);
  assert.equal(pdfCases.clients.length, 2);
  const pdfCase = (
    await check(
      await context.request.get(
        `${api}/cases?id=${pdfCases.clients.find((c) => c.id !== id).id}`,
      ),
      200,
    )
  ).client;
  assert.equal(pdfCase.case.document.sourceType, "application/pdf");
  assert.ok(pdfCase.case.document.pages.length >= 1);
  const pdfPage = await context.newPage();
  await pdfPage.setContent(
    Array.from(
      { length: 5 },
      (_, i) => `<div style="break-after:page">Page ${i}</div>`,
    ).join(""),
  );
  const tooManyPages = await pdfPage.pdf();
  await pdfPage.close();
  await check(
    await post(anon, `/public/${link.token}`, {
      ...synthetic,
      consent: true,
      document: {
        mime: "application/pdf",
        data: tooManyPages.toString("base64"),
        consent: true,
      },
    }),
    400,
  );
  await check(
    await post(anon, `/public/${link.token}`, {
      ...synthetic,
      consent: true,
      document: { ...upload, data: "A".repeat(3 * 1024 * 1024) },
    }),
    413,
  );
  // Exercise actual customer form: uncertain time is explicit, not silently guessed.
  await anonPage.goto(`${origin}${base}/pro/s/${link.token}`);
  await anonPage.getByLabel("උපන් දිනය", { exact: true }).fill(synthetic.date);
  await anonPage.getByLabel("Unsure of birth time").check();
  await anonPage.getByLabel("Birth document upload").setInputFiles({
    name: "synthetic-record.jpg",
    mimeType: "image/jpeg",
    buffer: image,
  });
  await anonPage.getByLabel("Document consent").check();
  await anonPage.getByLabel("Birth data consent").check();
  await anonPage.setViewportSize({ width: 390, height: 844 });
  await anonPage.screenshot({
    path: path.join(shots, "pro-cases-intake-mobile.png"),
    fullPage: true,
  });
  await anonPage
    .getByRole("button", { name: "කේන්ද්‍රය ගණනය කරන්න →", exact: true })
    .click();
  await anonPage.locator(".pro-result .pro-chart-grid").waitFor();
  const uiInbox = await check(await context.request.get(`${api}/cases`), 200);
  assert.equal(uiInbox.clients.length, 3);
  const uiCase = (
    await check(
      await context.request.get(
        `${api}/cases?id=${uiInbox.clients.find((c) => c.id !== id && c.id !== pdfCase.id).id}`,
      ),
      200,
    )
  ).client;
  assert.equal(uiCase.case.timeUnsure, true);
  assert.equal(uiCase.input.time, "12:00");
  const page = await context.newPage();
  await page.setViewportSize({ width: 1500, height: 1000 });
  await page.goto(`${origin}${base}/pro/cases`);
  await page.getByLabel("Search cases").waitFor();
  await page.locator(".pro-list li").first().waitFor();
  await page.screenshot({
    path: path.join(shots, "pro-cases-inbox-desktop.png"),
    fullPage: true,
  });
  await page.getByLabel("Search cases").fill("Career investigation");
  await page.waitForFunction(
    () => document.querySelectorAll(".pro-list li").length === 1,
  );
  assert.equal(await page.locator(".pro-list li").count(), 1);
  await page.goto(`${origin}${base}/pro/cases?id=${id}`);
  await page.locator(".studio-wheel").waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector(".studio-canvas")?.getAttribute("aria-busy") ===
      "false",
  );
  assert.equal(
    await page.getByLabel("දිනය / Date", { exact: true }).inputValue(),
    "2000-01-01",
  );
  assert.equal(await page.getByLabel("Divisional chart").inputValue(), "9");
  await page
    .getByLabel("Document Lagna", { exact: true })
    .selectOption(
      String((Math.floor(current.result.lagna.longitude / 30) + 1) % 12),
    );
  await page.locator(".case-mismatch").first().waitFor();
  await page.getByLabel("වේලාව / Time", { exact: true }).fill("12:20");
  await page.waitForTimeout(1200);
  await page.waitForFunction(
    () =>
      document.querySelector(".studio-canvas")?.getAttribute("aria-busy") ===
      "false",
  );
  await page
    .getByText("වේලා නිවැරදි කිරීමේ සහාය / Rectification assist", {
      exact: true,
    })
    .click();
  await page
    .getByLabel("Rectification reason")
    .fill("Synthetic manually reviewed matching-window hypothesis");
  await page.getByLabel("Confirm corrected time").check();
  await page.getByRole("button", { name: /Lock corrected time/ }).click();
  await page.getByText(/Locked hypothesis:/).waitFor();
  await page.reload();
  await page.locator(".studio-wheel").waitFor();
  assert.equal(
    await page.getByLabel("වේලාව / Time", { exact: true }).inputValue(),
    "12:20",
  );
  await page.getByLabel("Divisional chart").selectOption("1");
  await page.getByLabel("Dasha date jump").fill("2001-01-01");
  await page.getByRole("button", { name: /Save case state/ }).click();
  await page.getByRole("status").filter({ hasText: "Case saved" }).waitFor();
  await page.reload();
  await page.locator(".studio-wheel").waitFor();
  assert.equal(
    await page.getByLabel("Dasha date jump").inputValue(),
    "2001-01-01",
  );
  await page.locator(".studio-canvas").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(shots, "pro-cases-investigation-desktop.png"),
  });
  await page.getByRole("button", { name: "වාර්තාව", exact: true }).click();
  await page
    .getByRole("button", { name: "පෙරදසුන", exact: true })
    .last()
    .click();
  await page.getByTitle("Customer report preview").waitFor();
  await page.getByTitle("Customer report preview").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(shots, "pro-cases-report-desktop.png"),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "කේන්ද්‍ර වැඩබිම", exact: true })
    .click();
  await page.locator(".studio-canvas").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(shots, "pro-cases-mobile.png") });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Mobile overflow",
  );
  await page.locator(".case-document-viewport").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(shots, "pro-cases-document-mobile.png"),
  });
  current = (
    await check(await context.request.get(`${api}/cases?id=${id}`), 200)
  ).client;
  assert.equal(current.input.time, "12:00");
  assert.equal(current.case.rectification.corrected.time, "12:20");
  assert.ok(
    current.case.timeline.some(
      (t) => t.action.includes("12:00") && t.action.includes("12:20"),
    ),
  );
  expired.add(subjectFor("pilot-a@example.test"));
  await check(await context.request.get(`${api}/cases?id=${id}`), 200);
  await check(
    await post(context, "/cases", {
      action: "state",
      id,
      revision: current.case.revision,
      state: current.case.state,
    }),
    402,
  );
  assert.equal(
    (
      await post(context, "/cases/pdf", { id, reportId: final.id, issue: true })
    ).status(),
    200,
    "Expired licence retains export access",
  );
  await check(
    await post(context, "/workspace", { action: "deleteClient", id }),
    200,
  );
  await check(await context.request.get(`${api}/cases?id=${id}`), 404);
  console.log(
    "Cases E2E passed: consented intake image/PDF sanitization, EXIF removal, PDF page/byte bounds, tenant isolation, CSRF, lifecycle/revision gates, private reviewed Sinhala PDF, exact studio/dasha restore, rectification audit, responsive inbox/document/report screenshots, expired-license export and cascade deletion. No customer contacted.",
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
