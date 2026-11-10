/** Synthetic transport contract tests. No network/SMTP/storage access. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  startVerification,
  verifyEmail,
  entitlement,
} from "../src/lib/pro/lums";
const originalFetch = globalThis.fetch,
  originalEnv = { ...process.env };
const secret = "synthetic-pro-service-key-at-least-32-characters",
  challengeId = "a".repeat(64),
  subject = randomUUID();
let status = 200,
  payload: unknown = { challengeId },
  calls = 0,
  latest: RequestInit | undefined;
globalThis.fetch = async (input, init) => {
  calls++;
  latest = init;
  assert.match(
    String(input),
    /^https:\/\/lums\.example\.test\/api\/jyotisha-pro\//,
  );
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};
try {
  process.env.PRO_LUMS_API_URL = "https://lums.example.test/api";
  process.env.PRO_LUMS_SERVICE_KEY = secret;
  assert.deepEqual(
    await startVerification("synthetic@example.test", "register", "192.0.2.77"),
    { challengeId },
  );
  assert.equal(
    new Headers(latest!.headers).get("Authorization"),
    `Bearer ${secret}`,
  );
  assert.equal(
    new Headers(latest!.headers).get("x-jyotisha-pro-client-ip"),
    "192.0.2.77",
  );
  assert.deepEqual(JSON.parse(latest!.body as string), {
    email: "synthetic@example.test",
    intent: "register",
    audience: "JYOTISHA_PRO",
  });
  assert.equal(latest!.cache, "no-store");
  assert.equal(latest!.redirect, "error");
  payload = {
    audience: "JYOTISHA_PRO",
    verified: true,
    subject,
    email: "synthetic@example.test",
  };
  assert.equal(
    (await verifyEmail(challengeId, "123456", "not-an-ip")).subject,
    subject,
  );
  assert.equal(
    new Headers(latest!.headers).get("x-jyotisha-pro-client-ip"),
    null,
  );
  assert.deepEqual(JSON.parse(latest!.body as string), {
    challengeId,
    code: "123456",
    audience: "JYOTISHA_PRO",
  });
  payload = {
    product: "JYOTISHA_PRO",
    active: true,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    kind: "trial",
  };
  assert.equal((await entitlement(subject)).active, true);
  assert.deepEqual(JSON.parse(latest!.body as string), {
    subject,
    product: "JYOTISHA_PRO",
    trialDays: 20,
  });
  for (const invalid of [
    { ...payload, product: "HADAHANA" },
    { ...payload, expiresAt: null },
    {
      audience: "HADAHANA",
      verified: true,
      subject,
      email: "synthetic@example.test",
    },
    {
      audience: "JYOTISHA_PRO",
      verified: true,
      subject: "consumer-subject",
      email: "synthetic@example.test",
    },
  ]) {
    payload = invalid;
    await assert.rejects(
      verifyEmail(challengeId, "123456"),
      (e) => (e as { status: number }).status === 503,
    );
  }
  status = 429;
  payload = {};
  await assert.rejects(
    startVerification("synthetic@example.test", "login"),
    (e) => (e as { status: number }).status === 429,
  );
  status = 401;
  await assert.rejects(
    verifyEmail(challengeId, "000000"),
    (e) => (e as { status: number }).status === 401,
  );
  status = 500;
  payload = { error: "synthetic sensitive internal detail" };
  await assert.rejects(
    entitlement(subject),
    (e) =>
      (e as Error).message.indexOf("sensitive") < 0 &&
      (e as { status: number }).status === 503,
  );
  const before = calls;
  delete process.env.PRO_LUMS_SERVICE_KEY;
  await assert.rejects(startVerification("synthetic@example.test", "register"));
  assert.equal(calls, before);
  process.env.PRO_LUMS_SERVICE_KEY = "short";
  await assert.rejects(entitlement(subject));
  assert.equal(calls, before);
  process.env.PRO_LUMS_SERVICE_KEY = secret;
  process.env.PRO_LUMS_API_URL = "http://lums.example.test/api";
  await assert.rejects(entitlement(subject));
  assert.equal(calls, before);
  console.log(
    "Pro real-client contracts, UUID identity/audience checks, trusted IP forwarding, rate status and fail-closed configuration passed (synthetic transport).",
  );
} finally {
  globalThis.fetch = originalFetch;
  process.env = originalEnv;
}
