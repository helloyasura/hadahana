// Isolated local app + mock LUMS; never contacts production or a signed-in browser.
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
import { chromium } from "/workspace/hadahana-redesign/node_modules/playwright/index.mjs";
const shots = "/workspace/hadahana-names-shots";
await mkdir(shots, { recursive: true });
const env = {
  ...process.env,
  NEXT_PUBLIC_BASE_PATH: "/hadahana",
  OPENAI_API_KEY: "",
  SESSION_SECRET: randomBytes(48).toString("hex"),
  LUMS_API_URL: "http://127.0.0.1:4354/api",
  NAME_FEEDBACK_DB_PATH: `/tmp/name-ui-${Date.now()}.json`,
  NEXT_PUBLIC_POSTHOG_KEY: "",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
};
const children = [];
let browser;
function run(args, cwd = process.cwd(), extra = {}) {
  const c = spawn(process.execPath, args, {
    cwd,
    env: { ...env, ...extra },
    stdio: "inherit",
  });
  children.push(c);
  return c;
}
async function ready(u) {
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(u)).ok) return;
    } catch {}
    await delay(1000);
  }
  throw Error("Test server startup timed out");
}
try {
  run(["scripts/profile-fixture.mjs"], process.cwd(), {
    PROFILE_FIXTURE_PORT: "4354",
  });
  browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox"],
  });
  for (const stage of ["before", "after"]) {
    const port = stage === "before" ? 4351 : 4352,
      root = `http://127.0.0.1:${port}/hadahana`;
    run(
      [
        "node_modules/next/dist/bin/next",
        "dev",
        "--turbopack",
        "-p",
        String(port),
      ],
      stage === "before" ? "/workspace/hadahana-names-before" : process.cwd(),
      { NAME_FEEDBACK_DB_PATH: "/sys/hadahana-name-feedback-test.json" },
    );
    await ready(root);
    for (const width of [390, 1280]) {
      const ctx = await browser.newContext({
          viewport: { width, height: 900 },
        }),
        page = await ctx.newPage();
      const post = (path, data) =>
        ctx.request.post(root + path, {
          headers: { "X-Hadahana-Action": "1" },
          data,
        });
      assert.equal((await post("/api/names/reshuffle", {})).status(), 401);
      await post("/api/cast", {
        date: "2026-11-04",
        time: "05:46",
        latitude: 7.2744,
        longitude: 80.61115,
        gender: "male",
        timezone: "Asia/Colombo",
      });
      await post("/api/account", {
        action: "signup",
        name: "Unnamed test",
        email: `${stage}${width}@example.test`,
        password: "Local-test123",
      });
      await post("/api/account", { action: "verify-email", code: "123456" });
      const account = await (
          await ctx.request.get(root + "/api/account")
        ).json(),
        id = account.profile.horoscopes[0].id;
      await page.goto(root + `?horoscope=${id}`);
      await page.locator("#kendraya-satahana").waitFor({ timeout: 60000 });
      await page.getByRole("button", { name: "English", exact: true }).click();
      await page.locator(".tabs button").nth(1).click();
      await page.addStyleTag({
        content:
          "nextjs-portal{display:none!important} *{animation-duration:0s!important;scroll-behavior:auto!important}.reveal{opacity:1!important;transform:none!important}",
      });
      await page
        .getByRole("tab", { name: "Manual letters", exact: true })
        .click();
      await page
        .getByLabel(/First-name letters/)
        .fill("ට, ටි, ම, මි, මු, ප, පි");
      if (stage === "before")
        await page.getByLabel(/Verify against current-generation/).uncheck();
      await page
        .getByLabel(/Number of names/)
        .fill(stage === "before" ? "100" : "20");
      if (stage === "after")
        assert.equal(
          await page
            .getByLabel("Religion / culture preference", { exact: true })
            .inputValue(),
          "buddhist",
        );
      const response = page.waitForResponse((r) =>
        r.url().endsWith("/api/names/suggest"),
      );
      await page.getByRole("button", { name: /^Generate \d+ first/ }).click();
      const result = await (await response).json();
      assert(result.ok);
      await page.locator(".name-card").first().waitFor();
      await page.waitForFunction(
        () =>
          !document.querySelector(".name-studio > button.primary")?.disabled,
      );
      await page.locator(".name-studio-head").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${shots}/${stage}-controls-${width}.png`,
      });
      await page.locator(".name-card").first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${shots}/${stage}-names-${width}.png` });
      const legacy = {
        current: result.names[0],
        part: "first",
        pool: result.names,
        firstLetters: result.letters.first,
        middleLetters: result.letters.middle,
        primary: result.letters.primary,
        gender: "male",
        religionContext: "buddhist",
        recordDownvote: false,
      };
      if (stage === "before") {
        assert.equal(result.names.length, 100);
        const r = await post("/api/names/reshuffle", legacy);
        assert.equal(r.status(), 400);
        const j = await r.json();
        assert(j.error.includes("pool"));
        const unwritable = await post("/api/names/reshuffle", {
          ...legacy,
          pool: result.names.slice(0, 20),
          recordDownvote: true,
        });
        assert.equal(unwritable.status(), 400);
        const failure = await unwritable.json();
        assert(/EACCES|EROFS|permission|read-only/i.test(failure.error));
        await writeFile(
          `${shots}/reshuffle-before-unwritable.json`,
          JSON.stringify(
            { status: unwritable.status(), response: failure },
            null,
            2,
          ),
        );
        await writeFile(
          `${shots}/reshuffle-before-400.json`,
          JSON.stringify({ status: r.status(), response: j }, null, 2),
        );
      } else {
        assert.equal(result.names.length, 20);
        assert(
          result.names.every(
            (n) =>
              n.religionTags.includes("buddhist") &&
              n.meaningStatus === "sourced",
          ),
        );
        const old = JSON.parse(await readFile(`${shots}/before.json`, "utf8"));
        const r = await post("/api/names/reshuffle", {
          ...legacy,
          pool: old.names,
        });
        assert.notEqual(
          r.status(),
          400,
          "100-item legacy pool must pass validation",
        );
        const changed = page.waitForResponse((r) =>
          r.url().endsWith("/api/names/reshuffle"),
        );
        await page
          .locator(".name-card")
          .first()
          .getByRole("button", { name: "Swap first", exact: true })
          .click();
        const swapped = await changed;
        assert.equal(swapped.status(), 200);
        const next = await swapped.json();
        assert.equal(
          next.feedbackSaved,
          false,
          "Optional feedback outage does not break replacement",
        );
        assert(next.warning);
        assert(!result.names.some((n) => n.roman === next.name.roman));
        assert.equal(next.name.middle.roman, result.names[0].middle.roman);
        const again = page.waitForResponse((r) =>
          r.url().endsWith("/api/names/suggest"),
        );
        await page.getByRole("button", { name: /^Generate \d+ first/ }).click();
        const second = await (await again).json();
        const prior = new Set([
          ...result.names.map((n) => n.roman),
          next.name.roman,
        ]);
        assert(
          second.names.every((n) => !prior.has(n.roman)),
          "Regenerate excludes prior shown pairs",
        );
        await page
          .getByLabel("Religion / culture preference", { exact: true })
          .selectOption("christian");
        assert.equal(
          await page.locator(".name-card").count(),
          0,
          "Changing culture invalidates old results",
        );
        for (const religionContext of [
          "buddhist",
          "hindu",
          "christian",
          "islamic",
          "secular",
        ]) {
          const response = await post("/api/names/suggest", {
            birth: {
              gender: "male",
              date: "2026-11-04",
              time: "05:46",
              placeId: "colombo",
            },
            letterSource: "manual",
            manualFirstLetters: [
              "ම",
              "ප",
              "අ",
              "ආ",
              "ක",
              "න",
              "ඩ",
              "ග",
              "ස",
              "ර",
              "ය",
              "ඉ",
            ],
            religionContext,
            count: 20,
            verifyCurrentUsage: false,
          });
          const j = await response.json();
          assert(j.names.length > 0);
          assert(
            j.names.every((n) => n.religionTags.includes(religionContext)),
            religionContext,
          );
        }
        assert.equal(
          (
            await post("/api/names/reshuffle", {
              ...legacy,
              pool: Array(201).fill(result.names[0]),
            })
          ).status(),
          400,
          "Oversized requests still rejected",
        );
        assert.equal(
          (
            await post("/api/names/reshuffle", {
              ...legacy,
              padding: "x".repeat(768001),
            })
          ).status(),
          413,
          "Encoded body byte limit is enforced",
        );
        await page
          .getByLabel("Religion / culture preference", { exact: true })
          .selectOption("buddhist");
        await page
          .getByLabel(
            "Show modern names with unverified meanings (review only)",
            { exact: true },
          )
          .check();
        const reviewed = page.waitForResponse((r) =>
          r.url().endsWith("/api/names/suggest"),
        );
        await page.getByRole("button", { name: /^Generate \d+ first/ }).click();
        const reviewNames = await (await reviewed).json();
        assert(reviewNames.names.some((n) => n.meaningStatus === "review"));
        await page
          .locator(".name-review-warning")
          .first()
          .scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${shots}/after-review-${width}.png` });
        await page.getByRole("button", { name: "සිංහල", exact: true }).click();
        await page
          .locator(".name-review-warning")
          .first()
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `${shots}/after-si-review-${width}.png`,
        });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          "No horizontal overflow",
        );
      }
      await ctx.close();
    }
  }
  console.log(
    "Names UI passed at 390/1280: reproduced baseline 100-pool 400, fixed validation, real swap, nonrepeating regeneration, culture invalidation, all five culture filters and guest gate.",
  );
} finally {
  await browser?.close();
  for (const c of children) c.kill("SIGTERM");
}
