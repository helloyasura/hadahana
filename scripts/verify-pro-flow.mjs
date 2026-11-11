/** Synthetic-only end-to-end harness. Never contacts LUMS, sends email or seeds a prod bypass. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const { chromium } = await import(
  process.env.PRO_PLAYWRIGHT_MODULE || "playwright"
);
const dir = await mkdtemp(path.join(tmpdir(), "pro-flow-"));
const origin = "http://127.0.0.1:4177",
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
    "4177",
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
    ),
    defaults = workspace.presets[0];
  const cookie = (await context.cookies()).find(
    (c) => c.name === "jyotisha_pro_session",
  );
  assert.ok(cookie.httpOnly);
  assert.equal(cookie.path, "/hadahana/pro");
  assert.equal(cookie.sameSite, "Strict");
  await check(
    await post(context, "/workspace", {
      action: "profile",
      displayName: "නවෝද · ආදර්ශ ජෝතිෂ්‍යවේදී",
      qualifications: "ස්වයං ප්‍රකාශිත · පරීක්ෂණ පැතිකඩක් පමණි",
      contact: "synthetic@example.test",
      logo: "",
    }),
    200,
  );
  await check(
    await post(context, "/workspace", {
      action: "preset",
      name: "නවෝදගේ රාමන් ක්‍රමය",
      config: {
        ...defaults.config,
        ayanamsa: "raman",
        nodes: "true",
        dasaYearDays: 360,
      },
    }),
    200,
  );
  await check(
    await post(context, "/workspace", {
      action: "preset",
      name: "unsupported",
      config: { ...defaults.config, ayanamsa: "true_chitra" },
    }),
    400,
  );
  await check(
    await post(other, "/workspace", {
      action: "link",
      presetId: defaults.id,
      label: "cross tenant",
      days: 1,
      maxUses: 1,
    }),
    404,
  );
  const one = await check(
    await post(context, "/workspace", {
      action: "link",
      presetId: defaults.id,
      label: "එක් වරක් · පරීක්ෂණය",
      days: 2,
      maxUses: 1,
    }),
    200,
  );
  const synthetic = {
    date: "2001-07-12",
    time: "10:30",
    latitude: 6.9271,
    longitude: 79.8612,
    timezone: "Asia/Colombo",
    consent: true,
  };
  await check(
    await post(context, `/public/${one.token}`, {
      ...synthetic,
      consent: false,
    }),
    400,
  );
  const two = await Promise.all([
    post(context, `/public/${one.token}`, synthetic),
    post(context, `/public/${one.token}`, synthetic),
  ]);
  assert.deepEqual(
    two.map((r) => r.status()).sort(),
    [200, 410],
    "max uses must be atomic",
  );
  const saved = await check(await context.request.get(`${api}/workspace`), 200);
  assert.equal(saved.clients.length, 1);
  assert.ok(!JSON.stringify(saved.links).includes(one.token));
  assert.ok(!JSON.stringify(saved.links).includes("tokenHash"));
  await check(
    await other.request.get(`${api}/workspace?client=${saved.clients[0].id}`),
    404,
  );
  const snapshot = await check(
    await context.request.get(`${api}/workspace?client=${saved.clients[0].id}`),
    200,
  );
  assert.equal(snapshot.client.manifest.configHash.length, 64);
  assert.equal(snapshot.client.consentVersion, "pro-v1");
  await check(
    await post(context, "/workspace", {
      action: "preset",
      name: "Hadahana default",
      config: { ...defaults.config, ayanamsa: "raman" },
    }),
    200,
  );
  const versions = await check(
    await context.request.get(`${api}/workspace`),
    200,
  );
  assert.equal(
    versions.presets.find((p) => p.id === defaults.id).config.ayanamsa,
    "lahiri",
  );
  assert.equal(
    versions.presets.filter((p) => p.name === "Hadahana default").at(-1)
      .version,
    2,
  );
  const shared = await check(
    await post(context, "/workspace", {
      action: "link",
      presetId: defaults.id,
      label: "නොවැම්බර් · ආදර්ශ සේවාලාභීන්",
      days: 30,
      maxUses: 10,
    }),
    200,
  );
  expired.add(subjectFor("pilot-a@example.test"));
  await check(await post(context, `/public/${shared.token}`, synthetic), 402);
  await check(
    await context.request.get(`${api}/workspace?client=${saved.clients[0].id}`),
    200,
  );
  expired.clear();
  const revoked = await check(
    await post(context, "/workspace", {
      action: "link",
      presetId: defaults.id,
      label: "අවලංගු කළ උදාහරණය",
      days: 1,
      maxUses: 2,
    }),
    200,
  );
  const toRevoke = (
    await check(await context.request.get(`${api}/workspace`), 200)
  ).links.at(-1);
  await check(
    await post(context, "/workspace", { action: "revoke", id: toRevoke.id }),
    200,
  );
  await check(await context.request.get(`${api}/public/${revoked.token}`), 410);
  const shots =
    process.env.PRO_SCREENSHOTS_DIR || "/workspace/jyotisha-pro-shots";
  await mkdir(shots, { recursive: true });
  const page = await context.newPage();
  const pages = [
    ["login", "/pro/login", ".pro-auth-card"],
    ["register", "/pro/register", ".pro-auth-card"],
    ["dashboard", "/pro", ".pro-stats"],
    ["preset-editor", "/pro/presets", ".pro-field-grid"],
    ["link-generator", "/pro/links", ".pro-work-grid"],
    ["public-link", `/pro/s/${shared.token}`, ".pro-work-grid"],
  ];
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, url, selector] of pages) {
      await page.goto(`${origin}${base}${url}`);
      await page.locator(selector).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (name === "link-generator") {
        await page
          .getByRole("button", { name: "සබැඳිය ජනනය කරන්න ↗" })
          .click();
        await page.getByLabel("Generated private link").waitFor();
      }
      if (name === "dashboard")
        await page.getByText("සේවාලාභී 01", { exact: true }).waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${name} overflow at ${width}`,
      );
      await page.addStyleTag({
        content: "nextjs-portal{display:none!important}",
      });
      await page.screenshot({
        path: path.join(shots, `${name}-${width}.png`),
        fullPage: true,
      });
    }
    await page.getByLabel("උපන් දිනය", { exact: true }).fill(synthetic.date);
    await page.getByLabel("උපන් වේලාව", { exact: true }).fill(synthetic.time);
    await page.getByLabel("Birth data consent").check();
    await page.getByRole("button", { name: "කේන්ද්‍රය ගණනය කරන්න →" }).click();
    await page.locator(".pro-result .pro-chart-grid").waitFor();
    await page.addStyleTag({
      content: "nextjs-portal{display:none!important}",
    });
    await page.screenshot({
      path: path.join(shots, `public-result-${width}.png`),
      fullPage: true,
    });
  }
  await check(
    await context.request.post(`${api}/auth`, {
      data: { action: "logout" },
      headers: { ...headers, Origin: "https://untrusted.example" },
    }),
    403,
  );
  const locked = await browser.newContext();
  await check(
    await post(locked, "/auth", {
      action: "start",
      email: "locked@example.test",
      displayName: "Synthetic locked account",
      intent: "register",
    }),
    200,
  );
  for (let i = 0; i < 5; i++)
    await check(
      await post(locked, "/auth", { action: "verify", code: "999999" }),
      401,
    );
  await check(
    await post(locked, "/auth", { action: "verify", code: "123456" }),
    401,
  );
  await locked.close();
  expired.add(subjectFor("pilot-a@example.test"));
  for (let i = 0; i < 3; i++)
    await check(await post(context, `/public/${shared.token}`, synthetic), 402);
  await check(await post(context, `/public/${shared.token}`, synthetic), 429);
  expired.clear();
  await check(
    await post(other, "/workspace", {
      action: "deleteClient",
      id: saved.clients[0].id,
    }),
    404,
  );
  expired.add(subjectFor("pilot-a@example.test"));
  await check(
    await post(context, "/workspace", {
      action: "deleteClient",
      id: saved.clients[0].id,
    }),
    200,
  );
  expired.clear();
  await check(await post(context, "/auth", { action: "logout" }), 200);
  await check(await context.request.get(`${api}/workspace`), 401);
  console.log(
    "Pro E2E passed: separate OTP/session, CSRF, cross-tenant denial, immutable versions, consent, max-use race, revocation, licensing fail-closed, expired-license export/delete, logout, responsive screenshots.",
  );
  console.log(`Screenshots: ${shots} (390px and 1280px, synthetic only)`);
} catch (e) {
  await writeFile(path.join(dir, "next.log"), logs);
  console.error(`Synthetic harness app log: ${path.join(dir, "next.log")}`);
  throw e;
} finally {
  await browser?.close();
  app.kill("SIGTERM");
  await new Promise((r) => app.once("exit", r));
  await new Promise((r) => mock.close(r));
  if (process.exitCode !== 1) await rm(dir, { recursive: true, force: true });
}
